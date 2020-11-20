precision mediump float;

uniform float terrainOffset;
uniform float terrainScale;
uniform float H;
uniform int nOctaves;
uniform float globalContrast;
uniform float globalBrightness;
uniform float time;
uniform int noise;
uniform float waterLevel;

uniform float fAmp;
uniform float fContrast;

uniform float h1Amp;
uniform float h1Contrast;

uniform float h2Amp;
uniform float h2Contrast;

uniform float h3Amp;
uniform float h3Contrast;

const float fFreq = 2.0; // texturing
const float h1Freq = 2.1; // Sparse hills
const float h2Freq = 3.0; // Mountains
const float h3Freq = 6.0; // Small hills

varying vec2 point;

const float PI = 3.1415926535;
const float lacunarity = 2.0;
const int MAX_ITERATIONS = 12;

// NOISE GENERATION SECTION

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x) {return mod(((x*34.0)+1.0)*x, 289.0);}
vec3 permute(vec3 x) {return mod(((x*34.0)+1.0)*x, 289.0);}
float adapt(float x) {return (x+1.0)/2.0;}

float rand2dTo1d(vec2 value, vec2 dotDir){
    vec2 smallValue = vec2(sin(value.x), sin(value.y));
    float random = dot(smallValue, dotDir);
    random = fract(sin(random) * 143758.5453);
    return random;
}

vec2 rand2dTo2d(vec2 value){
    return vec2(
        rand2dTo1d(value, vec2(12.989, 78.233)),
        rand2dTo1d(value, vec2(39.346, 11.135))
    );
}

//	Classic Perlin 2D Noise 
//	by Stefan Gustavson
//  https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float perlin(vec2 P){
    vec4 Pi = floor(vec4(P,P)) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(vec4(P,P)) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
            vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 *  n_xy;
}

// Cellular noise ("Worley noise") in 2D in GLSL.
// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
// This code is released under the conditions of the MIT license.
// See LICENSE file for details.
// https://github.com/stegu/webgl-noise
vec3 dist(vec3 x, vec3 y) {
  return (x * x + y * y);
}

float voronoiNoise(vec2 P) {
    float jitter = 1.0;
    float K= 0.142857142857; // 1/7
    float Ko= 0.428571428571 ;// 3/7
  	vec2 Pi = mod(floor(P), 289.0);
   	vec2 Pf = fract(P);
  	vec3 oi = vec3(-1.0, 0.0, 1.0);
  	vec3 of = vec3(-0.5, 0.5, 1.5);
  	vec3 px = permute(Pi.x + oi);
  	vec3 p = permute(px.x + Pi.y + oi); // p11, p12, p13
  	vec3 ox = fract(p*K) - Ko;
  	vec3 oy = mod(floor(p*K),7.0)*K - Ko;
  	vec3 dx = Pf.x + 0.5 + jitter*ox;
  	vec3 dy = Pf.y - of + jitter*oy;
  	vec3 d1 = dist(dx,dy); // d11, d12 and d13, squared
  	p = permute(px.y + Pi.y + oi); // p21, p22, p23
  	ox = fract(p*K) - Ko;
  	oy = mod(floor(p*K),7.0)*K - Ko;
  	dx = Pf.x - 0.5 + jitter*ox;
  	dy = Pf.y - of + jitter*oy;
  	vec3 d2 = dist(dx,dy); // d21, d22 and d23, squared
  	p = permute(px.z + Pi.y + oi); // p31, p32, p33
  	ox = fract(p*K) - Ko;
  	oy = mod(floor(p*K),7.0)*K - Ko;
  	dx = Pf.x - 1.5 + jitter*ox;
  	dy = Pf.y - of + jitter*oy;
  	vec3 d3 = dist(dx,dy); // d31, d32 and d33, squared
  	// Sort out the two smallest distances (F1, F2)
  	vec3 d1a = min(d1, d2);
  	d2 = max(d1, d2); // Swap to keep candidates for F2
  	d2 = min(d2, d3); // neither F1 nor F2 are now in d3
  	d1 = min(d1a, d2); // F1 is now in d1
  	d2 = max(d1a, d2); // Swap to keep candidates for F2
  	d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller
  	d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x
  	d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz
  	d1.y = min(d1.y, d1.z); // nor in  d1.z
  	d1.y = min(d1.y, d2.x); // F2 is in d1.y, we're done.
    return (d1.x-0.5)*2.0+1.0;
}

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float fbm(vec2 x, bool isPerlin)
{    
    float G = exp(-H);
    float f = 1.0;
    float a = 0.1;
    float t = 0.0;
    vec2 pos = x;
    for( int i=0; i<MAX_ITERATIONS; i++ )
    {
        if (i == nOctaves) break;
        t += isPerlin ? a*perlin(f*pos) : a*voronoiNoise(f*pos);
        f *= lacunarity;
        a *= G;
    }
    return t;
}

// https://www.classes.cs.uchicago.edu/archive/2015/fall/23700-1/final-project/MusgraveTerrain00.pdf
float hyrbidMultifractal(vec2 point, bool isPerlin){
    float frequency, result, signal, weight, noise;
    float exponent_array[100];
    vec2 p = point;
    float amp = 1.0;
    frequency = 1.0;

    //filling the exponent array
    for(int i=0; i<MAX_ITERATIONS; ++i){
        if (i == nOctaves) break;
        exponent_array[i] = pow(frequency, -H);
        frequency *= lacunarity;
    }

    frequency = 1.0;

    if(isPerlin)
    {
        noise = (perlin(p)) ;
    }
    else
    {
        noise = (voronoiNoise(p));

    }

    signal = result = 0.5*noise* exponent_array[0];
    weight = result;
    for(int i=1; i<MAX_ITERATIONS; i++) {
        if(i == nOctaves) break;

        noise = isPerlin ? perlin(p) : voronoiNoise(p);
        signal = noise*exponent_array[i];

        weight = min(weight, 1.0);
        result += weight*signal;
        weight *= signal;
        p *= lacunarity;
    }
    return result;
}

// Combine different fractals
float computeHeight(vec2 pos, bool usePerlin){
    vec2 p = pos;
    float b2 = ((fbm(p*fFreq, usePerlin)-0.5)*fContrast+0.5)*fAmp;
    float h1 = ((hyrbidMultifractal(p*h1Freq, true) - 0.5)*h1Contrast+0.5)*h1Amp;
    float h2 = ((hyrbidMultifractal(p*h2Freq, false) - 0.5)*h2Contrast+0.5)*h2Amp;
    float h3 = ((hyrbidMultifractal(p*h3Freq, true) - 0.5)*h3Contrast+0.5)*h3Amp;

    return (((b2+h1+h2+h3 + globalBrightness)-0.5)*globalContrast+0.5);
}

// Custom made water animation inspired by https://www.shadertoy.com/view/wdG3Rz
float computeWaterAnimation(float height, vec2 fractalPoint)
{
    float firstNoise = (((fbm(fractalPoint*60.0 - time, false)-0.5)*0.4+0.5)*0.3);
    vec2 offset = vec2(-10.0, 100);
    float secondNoise = (((fbm((fractalPoint+offset)*40.0 + time*0.4, false)-0.5)*0.4+0.5)*0.3);
    return waterLevel - 0.15 + min((firstNoise + secondNoise)/2.5, 0.15);
}

// https://stackoverflow.com/questions/18453302/how-do-you-pack-one-32bit-int-into-4-8bit-ints-in-glsl-webgl
const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
vec4 EncodeFloatRGBA (float v) {
    vec4 enc = bitEnc * v;
    enc = fract(enc);
    enc -= enc.yzww * vec2(1./255., 0.).xxxy;
    return enc;
}

void main() {
    // Allow to offset and scale the terrain
    vec2 fractalPoint = ((point - vec2(0.5)) * terrainScale) + vec2(terrainOffset);
    bool usePerlin = noise == 0;
    
    float value = computeHeight(fractalPoint, usePerlin);
    if (value <= waterLevel)
    {
        value = computeWaterAnimation(value, fractalPoint);
    }

    // We ensure the value is <= 1.0 in order for the vector encoding to work properly
    gl_FragColor = EncodeFloatRGBA(min(value, 0.9999999));
}