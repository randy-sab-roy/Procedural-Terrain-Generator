precision mediump float;

uniform float terrainOffset;
uniform float terrainScale;
uniform int noise;
uniform float H;
uniform int nOctaves;

varying vec2 point;

const float PI = 3.1415926535;
bool first = true;
bool usePerlin;

const float lacunarity = 2.0;
const int MAX_ITERATIONS = 12;
const float offset = 0.0;
const float gain = 1.0;


// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x) {return mod(((x*34.0)+1.0)*x, 289.0);}
vec3 permute(vec3 x) {return mod(((x*34.0)+1.0)*x, 289.0);}
float adapt(float x) {return (x+1.0)/2.0;}

float rand2dTo1d(vec2 value, vec2 dotDir){
    // vec2 dotDir = vec2(12.9898, 78.233);
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
    return 2.3 *  n_xy+.3;
}

vec3 dist(vec3 x, vec3 y,  bool manhattanDistance) {
  return manhattanDistance ?  abs(x) + abs(y) :  (x * x + y * y);
}

float voronoiNoise(vec2 P) {
    float jitter = 1.0;
    bool manhattanDistance = false;
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
  	vec3 d1 = dist(dx,dy, manhattanDistance); // d11, d12 and d13, squared
  	p = permute(px.y + Pi.y + oi); // p21, p22, p23
  	ox = fract(p*K) - Ko;
  	oy = mod(floor(p*K),7.0)*K - Ko;
  	dx = Pf.x - 0.5 + jitter*ox;
  	dy = Pf.y - of + jitter*oy;
  	vec3 d2 = dist(dx,dy, manhattanDistance); // d21, d22 and d23, squared
  	p = permute(px.z + Pi.y + oi); // p31, p32, p33
  	ox = fract(p*K) - Ko;
  	oy = mod(floor(p*K),7.0)*K - Ko;
  	dx = Pf.x - 1.5 + jitter*ox;
  	dy = Pf.y - of + jitter*oy;
  	vec3 d3 = dist(dx,dy, manhattanDistance); // d31, d32 and d33, squared
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
    return (d1.x-0.5)*1.8+0.5;
}

float ridgenoise(vec2 x) {
  return 2.0 * (0.5 - abs(0.5 -  (usePerlin ? perlin(x) : voronoiNoise(x))));
}

float fbm(vec2 x)
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 0.5;
    float t = 0.0;
    float cumulative = 0.0;
    for( int i=0; i<MAX_ITERATIONS; i++ )
    {
        if (i == nOctaves) break;
        // t += usePerlin ? a*perlin(f*x) : a*voronoiNoise(f*x);
        t += a*ridgenoise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

// https://www.classes.cs.uchicago.edu/archive/2015/fall/23700-1/final-project/MusgraveTerrain00.pdf
float hyrbidMultifractal(vec2 point){
    float frequency, result, signal, weight, remainder;
    float exponent_array[100];
    vec2 p = point;
    frequency = 1.0;
    //filling the exponent array

    for(int i=0; i<MAX_ITERATIONS; ++i){
        if (i == nOctaves) break;
        exponent_array[i] = pow(frequency, -H);
        frequency *= lacunarity;
    }

    if(usePerlin)
    {
        result = (perlin(p)+offset) * exponent_array[0];
    }
    else
    {
        result = (voronoiNoise(p)+offset) * exponent_array[0];

    }
    weight = result;

    p *= lacunarity;


    for(int i=1; i<MAX_ITERATIONS; i++ ) {
        if (i == nOctaves) break;
        if(weight > 1.0) weight = 1.0;
        if(usePerlin)
        {
            signal = (perlin(p)+offset) * exponent_array[i];
        }
        else
        {
            signal = (voronoiNoise(p)+offset) * exponent_array[i];
        }
        result += weight*signal;
        weight*=signal;
        p *= lacunarity;
    }
    return (result-0.5)*0.5+0.5;

}

float computeHeight(vec2 pos){
    vec2 p = pos;
    float b2 = fbm(p)*0.5;
    float h1 = hyrbidMultifractal(p/2.5)+0.2;
    float h2 = (hyrbidMultifractal(p)*2.0 - 1.0)*0.5+0.5;
    float h3 = hyrbidMultifractal(p*20.0)*0.02;
    // b2 = min(b2, 1.0);
    // h1 = min(h1, 1.0);
    // h2 = min(h2, 1.0);
    // h3 = min(h3, 1.0);
    if(usePerlin)
    {
        float pre = b2+h1+h2;
        return ((pre * h3 + pre-1.0)-0.5)*0.6+0.5;
        return ((b2+h1+h2+h3-1.0)-0.5)*0.6+0.5;
    }
    else
    {
        float pre = b2+h1+h2;
        return ((pre * h3 + pre-1.0)-0.5)*0.6+0.5;
    }
        

}

void main() {
    // Allow to offset and scale the terrain
    usePerlin = noise == 0;
    vec2 fractalPoint = ((point - vec2(0.5)) * terrainScale) + vec2(terrainOffset);
    float value = computeHeight(fractalPoint);

    gl_FragColor = vec4(vec3(value), 1.0);
}