precision mediump float;

uniform float terrainOffset;
uniform float terrainScale;
uniform int noise;

varying vec2 point;

const float PI = 3.1415926535;
bool first = true;
bool usePerlin;
const float H = 0.25;
const float lacunarity = 2.0;
const int octaves = 7;
const float offset = 0.7;
const float gain = 1.0;


// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x) {return mod(((x*34.0)+1.0)*x, 289.0);}
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

float voronoiNoise(vec2 value){
    vec2 baseCell = floor(value);

    float minDistToCell = 10.0;
    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 cell = baseCell + vec2(x, y);
            vec2 cellPosition = cell + rand2dTo2d(cell);
            vec2 toCell = cellPosition - value;
            float distToCell = length(toCell);
            if(distToCell < minDistToCell){
                minDistToCell = distToCell;
            }
        }
    }
    return minDistToCell;
}

float fbm(vec2 x) {
    float value = 0.0;
    float a = 0.1;
    vec2 shift = vec2(100);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 8; ++i) {
        if(usePerlin)
        {
            value += a * perlin(x);
        }else
        {
            value += a * voronoiNoise(x);
        }
        x =  x * 2.0 + shift;
        a *= 0.5;
    }
    return value;
}

// https://www.classes.cs.uchicago.edu/archive/2015/fall/23700-1/final-project/MusgraveTerrain00.pdf
float hyrbidMultifractal(vec2 point, float H, float lacunarity, float offset, float gain){
    float frequency, result, signal, weight, remainder;
    float exponent_array[10];
    vec2 p = point;
    frequency = 1.0;
    //filling the exponent array

    for(int i=0; i<octaves; ++i){
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


    for(int i=1; i<octaves; i++ ) {
        if(weight > 1.0) weight = 1.0;
        signal = (perlin(p)+offset) * exponent_array[i];
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
    return result;

}

float computeHeight(vec2 pos){
    vec2 p = pos;

    float b2 = fbm(p*2.0);

    float h1 = hyrbidMultifractal(p/8.0, H, lacunarity, offset, gain);
    float h2 = hyrbidMultifractal(p*3.0, H, lacunarity, offset, gain*0.3)*0.5;
    float h3 = hyrbidMultifractal(p*2.0, H, lacunarity, offset, gain)*0.3;


    if(usePerlin)
    {
        return (b2+h1+h2+h3-0.8)/4.0;  
    }
    else
    {
        
        b2 = min(b2, 1.0);
        h1 = min(h1, 1.0);
        h2 = min(h2, 1.0);
        h3 = min(h3, 1.0);
        return (b2+h1)/2.0;  
    }
        

}

void main() {
    // Allow to offset and scale the terrain
    usePerlin = noise == 0;
    vec2 fractalPoint = ((point - vec2(0.5)) * terrainScale) + vec2(terrainOffset);
    float value = computeHeight(fractalPoint);

    gl_FragColor = vec4(vec3(value), 1.0);
}