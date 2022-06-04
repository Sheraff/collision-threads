import { PRECISION } from "./constants.js";

export function load(array, index) {
	return Atomics.load(array, index) / PRECISION
}

export function store(array, index, value) {
	return Atomics.store(array, index, value * PRECISION)
}

export function add(array, index, value) {
	return Atomics.add(array, index, value * PRECISION)
}

export function sub(array, index, value) {
	return Atomics.sub(array, index, value * PRECISION)
}