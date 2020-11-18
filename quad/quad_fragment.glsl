precision mediump float;
uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Sv;
uniform int mode;
uniform sampler2D heightMap;
uniform float waterLevel;
uniform float wsBlend;
uniform float sandLevel;
uniform float sgBlend;
uniform float grassLevel;
uniform float gsBlend;
uniform float rockAngle;
uniform float rockBlend;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
varying vec3 pos;
varying float height;
varying float fogValue;

const float infinity = 1.0 / 0.0;

const vec3 waterColor = vec3(0.0,0.11,0.22);
const vec3 sandColor = vec3(0.76, 0.69, 0.5);
const vec3 rockColor = vec3(0.3, 0.3, 0.3);
const vec3 snowColor = vec3(0.8, 0.8, 0.8);
const vec3 grassColor = vec3(0.15, 0.25, 0.11);

float sandMaxLevel = waterLevel+sandLevel;
float grassMaxLevel = sandMaxLevel+grassLevel;
const float grassSnowBlend = 0.01;

const vec3  lightColorA = vec3(1, 1, 0.97);
const vec3  lightColorD = vec3(1, 1, 0.94);
const vec3  lightDir = vec3(0.5, -1, 1);

float materialSv;

vec3 getMaterialBlending()
{
    vec3 adjustedGreen = grassColor/((height-0.5)*1.5+1.5);
    vec3 mat;
    if (height <= waterLevel+0.0002) {
        mat = waterColor;
        materialSv = 220.0;
    }
    else if (height < sandMaxLevel)
    {
        if(height < (waterLevel + wsBlend) )
        {
            float diff = (waterLevel + wsBlend) - height;
            float lerp = diff/wsBlend;
            materialSv = lerp > 0.7 ? 220.0 : infinity;
            mat = mix(sandColor, waterColor, lerp);
        }
        else
        {
            materialSv = 5000.0;//infinity;
            mat = sandColor;
        }
    }
    else if (height < grassMaxLevel)
    {
        materialSv = infinity;
        if(height < (sandMaxLevel + sgBlend) )
        {
            float diff = (sandMaxLevel + sgBlend) - height;
            float lerp = diff/sgBlend;
            mat = mix(adjustedGreen, sandColor, lerp);
        }
        else
        {
            mat = adjustedGreen;
        }
    }
    else
    {
        materialSv = infinity;
        if(height < (grassMaxLevel + gsBlend) )
        {
            float diff = (grassMaxLevel + gsBlend) - height;
            float lerp = diff/gsBlend;
            mat = mix(snowColor, adjustedGreen, lerp);
        }
        else
        {
            mat = snowColor;
        }
    }
    return mat;
}

vec3 getRockBlending(vec3 color)
{
    if (raw_normal.z>rockAngle-rockBlend && raw_normal.z<rockAngle+rockBlend)
    {
        float lerp = (raw_normal.z-(rockAngle-rockBlend))/(2.0*rockBlend);
        color = mix(rockColor, color, lerp);
    }
    else if (raw_normal.z<=rockAngle-rockBlend)
    {
        // ONLY ROCK
        color = rockColor;
    }
    return color;
}

vec4 getLightColor() {
    vec3 material_color;

    material_color = getMaterialBlending();
    if(height >= sandMaxLevel)
    {
        material_color = getRockBlending(material_color);
    }
    else
    {
        float diff = (sandMaxLevel-height);
        float lerp = diff/(sandMaxLevel-waterLevel);
        material_color = mix(getRockBlending(material_color),material_color,lerp);
    }

    // Height shading
    float cap = 0.6;
    material_color *= (height*cap)+cap;
    material_color = mix(vec3(0.5,0.5,0.5) , material_color, fogValue);

    // Lights
    vec3 N = normalize(normal);
    vec3 L = normalize(lightDir);
    float lambertian = max(dot(N, L), 0.0);
    float specular = 0.0;
    if(lambertian > 0.0) {
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-pos);
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, materialSv);
    }
    return vec4(Ka * material_color + Kd * lambertian * material_color + Ks * specular * material_color, 1.0);
}

void main() {
    if (mode == 0)
    {
        gl_FragColor = getLightColor();
    }
    else if(mode == 1)
    {
        gl_FragColor = vec4(normalize(abs(raw_normal)), 1.0);    
    }
    else if (mode == 2)
    {
        gl_FragColor = Ka * fcolor;
    }
    else if(mode == 3)
    {
        gl_FragColor = Ka * vec4(0.25, 0.53, 0.96, 1.0);
    }
}