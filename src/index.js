import {fromEvent} from 'rxjs'
import {map, pairwise, switchMap, takeUntil, withLatestFrom, startWith} from 'rxjs/operators'

const canvas = document.getElementById('canvas')
const range = document.getElementById('range')
const color = document.getElementById('color')
const clear = document.getElementById('clear')

const ctx = canvas.getContext('2d')
const rect = canvas.getBoundingClientRect()
const scale = window.devicePixelRatio

canvas.width = rect.width * scale
canvas.height = rect.height * scale
ctx.scale(scale, scale)

const mouseMove$ = fromEvent(canvas, 'mousemove')
const mouseDown$ = fromEvent(canvas, 'mousedown')
const mouseUp$ = fromEvent(canvas, 'mouseup')
const mouseOut$ = fromEvent(canvas, 'mouseout')

const lineWidth$= createInputStream(range)

const lineColor$= createInputStream(color)

const stream$ = mouseDown$
	.pipe(
		withLatestFrom(lineWidth$, lineColor$, (_, lineWidth, lineColor) => {
			return {
				lineWidth,
				lineColor
			}
		}),
		switchMap(options => {
			return mouseMove$
				.pipe(
					map(e => ({
							x: e.offsetX,
							y: e.offsetY,
							options
					})),
					pairwise(),
					takeUntil(mouseUp$),
					takeUntil(mouseOut$)
				)
		})
	)
	
	stream$.subscribe(([from, to]) => {	
		const {lineWidth, lineColor} = from.options

		ctx.lineWidth = lineWidth
		ctx.strokeStyle = lineColor
		ctx.beginPath()
		ctx.moveTo(from.x, from.y)
		ctx.lineTo(to.x, to.y)
		ctx.stroke()
	})

	document.getElementById('clear').addEventListener('click', function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}, false);

	function createInputStream(node) {
		return fromEvent(node, 'input')
		.pipe(
			map(e => e.target.value),
			startWith(node.value)
		)
	}