
use wasm_bindgen::prelude::*;

const PRECISION: u32 = 100000;
// const DELAY_BETWEEN_BALLS: u8 = 250;
const MIN_BALL_RADIUS: u8 = 10;
const MAX_BALL_RADIUS: u8 = 35;
const COLORS_COUNT: u16 = 42;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    // #[wasm_bindgen(js_namespace = console)]
    // fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: Vec<u32>);
    
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f32;
}

#[wasm_bindgen]
pub fn greet() {
    // log("Hello, collision-threads!");
}


#[wasm_bindgen]
pub fn trade(input: &[u32]) -> i32 {
    input.len() as i32
    // log(Vec::from(input));
    // input[0] = 10; // just changing some value here
    // Vec::from(input)
}

#[wasm_bindgen]
pub fn set(input: js_sys::SharedArrayBuffer) {
    let array = js_sys::Uint32Array::new(&input);
    // let vec = Vec::from(array);
    // vec[0] = 10;
}

#[wasm_bindgen]
pub fn getBuffer(bytes: u32) -> js_sys::Uint8Array {
    let buffer = js_sys::SharedArrayBuffer::new([1 as u32, 2 as u32, 3 as u32]);
    let array = js_sys::Uint8Array::new_with_byte_offset(&buffer, 0);
    array
}
// fn set(input: &mut [u8]) -> Vec<u8> {
//     input[0] = 10; // just changing some value here
//     Vec::from(input)
// }

#[wasm_bindgen]
pub fn step(
    count: u32,
    dt: f64,
    side: u32,
    _container_x: f64,
    container_y: f64,
    container_r: f64,
    last_ball_delay: f64,
    last_ball: u32,
    x: &mut [u32],
    y: &mut [u32],
    prev_x: &mut [u32],
    prev_y: &mut [u32],
    _acc_x: &mut [i32],
    _acc_y: &mut [i32],
    r: &mut [u8],
    alive: &mut [u8],
    color: &mut [u8],
) {
    add_ball(
        &count,
        &dt,
        &side,
        &container_y,
        &container_r,
        &last_ball_delay,
        &last_ball,
        x,
        y,
        prev_x,
        prev_y,
        r,
        alive,
        color,
    );
    // applyGravity();
    // applyConstraints();
    // solveCollisions();
    // updatePosition(dt);
}

fn add_ball(
    count: &u32,
    dt: &f64,
    side: &u32,
    container_y: &f64,
    container_r: &f64,
    last_ball_delay: &f64,
    last_ball: &u32,
    x: &mut [u32],
    y: &mut [u32],
    prev_x: &mut [u32],
    prev_y: &mut [u32],
    r: &mut [u8],
    alive: &mut [u8],
    color: &mut [u8],
) {
    if *last_ball_delay - dt > 0.0 || *last_ball >= *count {
        // return *last_ball_delay - *dt
        return;
    }
    let min = *side as f64 / 1000.0 * MIN_BALL_RADIUS as f64;
    let max = *side as f64 / 1000.0 * MAX_BALL_RADIUS as f64;
    let pos_x = *side as f64 / 2.0;
    let rand_prev_x = if random_bool() { -300 } else { 300 };
    let pos_y = *container_y - *container_r + 2.0 * max;
    let rand_prev_y = if random_bool() { -50 } else { 500 };
    let rand_r = random_int(min as i32, max as i32);
    
    store(x, *last_ball as usize, pos_x);
    store(prev_x, *last_ball as usize, pos_x - *dt * rand_prev_x as f64);

    store(y, *last_ball as usize, pos_y);
    store(prev_y, *last_ball as usize, pos_y - *dt * rand_prev_y as f64);

    r[*last_ball as usize] = rand_r as u8;
    alive[*last_ball as usize] = 1;
    color[*last_ball as usize] = random_int(0, COLORS_COUNT as i32) as u8;

    // set_last_ball(*last_ball + 1);
    
    // DELAY_BETWEEN_BALLS as f64 / 1000.0
    return;
}

fn store(array: &mut [u32], index: usize, value: f64) {
    array[index] = (value * PRECISION as f64) as u32;
}

fn random_float(min: f32, max: f32) -> f32 {
    min + (max - min) * random()
}

fn random_int(min: i32, max: i32) -> i32 {
    random_float(min as f32, (max + 1) as f32).floor() as i32
}

fn random_bool() -> bool {
    random_int(0, 1) == 1
}