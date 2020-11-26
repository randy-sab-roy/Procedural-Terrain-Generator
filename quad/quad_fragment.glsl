precision mediump float;
uniform float Ka;
uniform float Kd;
uniform int mode;
uniform float movement;
uniform float shadows;
uniform vec3 light;
uniform sampler2D heightMap;
uniform float waterLevel;
uniform float sandLevel;
uniform float grassLevel;
uniform float rockAngle;

const float wsBlend = 0.022;
const float sgBlend = 0.07;
const float gsBlend = 0.05;
const float rockBlend = 0.15;

const vec3 waterColor = vec3(0.0,0.11,0.22);
const vec3 sandColor = vec3(0.50, 0.46, 0.33);
const vec3 rockColor = vec3(0.2225, 0.175, 0.147);
const vec3 snowColor = vec3(0.6, 0.6, 0.61);
const vec3 grassColor = vec3(0.195, 0.325, 0.143);

varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
varying vec3 pos;
varying float height;
varying float fogValue;
varying float shadow;

float sandMaxLevel = waterLevel+sandLevel;
float grassMaxLevel = sandMaxLevel+grassLevel;
float Ks = 0.0;

vec3 getMaterialBlending()
{
    vec3 adjustedGreen = grassColor/((height-0.5)*1.5+1.5);
    vec3 mat;
    if (height <= waterLevel+0.0002) {
        mat = waterColor;
        Ks = 1.0;
    }
    else if (height < sandMaxLevel)
    {
        if(height < (waterLevel + wsBlend) )
        {
            float diff = (waterLevel + wsBlend) - height;
            float lerp = diff/wsBlend;
            Ks = lerp > 0.7 ? 1.0 : 0.01;
            mat = mix(sandColor, waterColor, lerp);
        }
        else
        {
            Ks = 0.01;
            mat = sandColor;
        }
    }
    else if (height < grassMaxLevel)
    {
        Ks = 0.02;
        if(height < (sandMaxLevel + sgBlend) )
        {
            float diff = (sandMaxLevel + sgBlend) - height;
            float lerp = diff/sgBlend;
            lerp = pow(lerp, 9.0); // Non-linear blend
            mat = mix(adjustedGreen, sandColor, lerp);
        }
        else
        {
            mat = adjustedGreen;
        }
    }
    else
    {
        Ks = 0.5;
        if(height < (grassMaxLevel + gsBlend))
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
        color = mix(color, rockColor, lerp);
    }
    else if (raw_normal.z>rockAngle+rockBlend)
    {
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

    // Fog
    material_color = mix(vec3(0.5,0.52,0.53) , material_color, fogValue);

    bool shadowsEnabled = (shadows == 0.0);
    if (shadowsEnabled)
    {
        float shadowWeight = (shadow-0.5)*0.8+1.0;
        material_color *= max(min(shadowWeight, 1.0), 0.0);
    }


    // Lights
    vec3 N = normalize(normal);
    vec3 L = normalize(light);
    float lambertian = max(dot(N, L), 0.0);
    float specular = 0.0;
    float materialSv = 220.0;
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