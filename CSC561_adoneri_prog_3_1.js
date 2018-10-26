/* Anjali Doneria, adoneri, 200200056 */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles.json"; // triangles file loc
//const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog3/ellipsoids.json"; // ellipsoids file loc
var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space
var fixedLightPosition = new vec4.fromValues(-3, 1, -0.5,1.0);

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triangleBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader

var colorPositionAttrib;
var colorBuffer;

//matrix variables
var matrixForModel;
var completeMatrix;
var completeMatrixMat;
var inverseModelMatrix;
var matrix1;
var matrix2;

var lightColor;
var lightColorMod;
var eyeColor;

var x, y, z;

//object to store triangle sets
class TriangleSet{
    
    constructor(indicesArray, normalArray, coordArray, triangleBufferSize) {
        this.indicesArray = indicesArray;
        this.normalArray = normalArray;
        this.coordArray = coordArray;
        
        this.triangleBufferSize = triangleBufferSize;

        this.model2matrix = mat4.create();
    }

    setSetCenter(center) {
        this.center = center;
    }
    
    //set colors
    setSpecularColor(specular) {
        this.specularColor = specular;
        this.n = 1;
    }
    setDiffuseColor(diffuse) {
        this.diffuseColor = diffuse;
    }
    setAmbientColor(ambient) {
        this.ambientColor = ambient;
    }
    
    //update colors
    updateSpecularColor() {
        for (var i = 0; i < 3; i++)
            this.specularColor[i] += 0.1;
        if(this.specularColor[i] > 1)
            this.specularColor[i] = 0.0;
        this.setEyeColor();
    }
    updateDiffuseColor() {
        for (var i = 0; i < 3; i++)
            this.diffuseColor[i] += 0.1;
        if(this.diffuseColor[i] > 1)
            this.diffuseColor[i] = 0.0;
        this.setEyeColor();
    }
    updateAmbientColor() {
        for (var i = 0; i < 3; i++)
            this.ambientColor[i] += 0.1;
        if(this.ambientColor[i] > 1)
            this.ambientColor[i] = 0.0;
        this.setEyeColor();
    }
    
    //set eye color
    setEyeColor() {
        this.eyeColor = mat4.fromValues(Eye[0], Eye[1], Eye[2], 1.0,
            this.ambientColor[0], this.ambientColor[1], this.ambientColor[2], 0.0,
            this.diffuseColor[0], this.diffuseColor[1], this.diffuseColor[2], 0.0,
            this.specularColor[0], this.specularColor[1], this.specularColor[2], this.n);
    }

    setShape(s) {
        this.shape = s;
    }
    
    updateSpecularN() {
        this.n++;
        if(this.n > 20)
            this.n = 1.0;
        this.setEyeColor();
    }
}

function selectModel(triangle, sel){
    var translatedMat = mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), triangle.center));
    mat4.multiply(triangle.model2matrix, translatedMat, triangle.model2matrix);

    var scaledMatrix = mat4.fromScaling(mat4.create(), vec3.fromValues(sel, sel, sel));
    mat4.multiply(triangle.model2matrix, scaledMatrix, triangle.model2matrix);
    
    var translatedFromCenter = mat4.fromTranslation(mat4.create(), triangle.center);
    mat4.multiply(triangle.model2matrix, translatedFromCenter, triangle.model2matrix);
}

function rotateModel(triangle, direction, angle){
    var translatedMat = mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), triangle.center));
    mat4.multiply(triangle.model2matrix, translatedMat, triangle.model2matrix);

    var rotatedMat = mat4.fromRotation(mat4.create(), angle, direction);
    mat4.multiply(triangle.model2matrix, rotatedMat, triangle.model2matrix);
    
    var translatedFromCenter = mat4.fromTranslation(mat4.create(), triangle.center);
    mat4.multiply(triangle.model2matrix, translatedFromCenter, triangle.model2matrix);
}

function translateModel(triangle, direction, trans){
    var translatedMat = mat4.fromTranslation(mat4.create(), vec3.scale(vec3.create(), direction, trans));
    mat4.multiply(triangle.model2matrix, translatedMat, triangle.model2matrix);

    var scaledMatrix = vec3.scale(vec3.create(), direction, trans);
    vec3.add(triangle.center, triangle.center, scaledMatrix);
}

function initializaMatrices() {
    x = vec3.fromValues(-1.0, 0.0, 0.0);
    y = vec3.fromValues(0.0, 1.0, 0.0);
    z = vec3.fromValues(0.0, 0.0, -1.0);
    
    var mat1 = mat4.fromValues(x[0], y[0], z[0], 0.0,
        x[1], y[1], z[1], 0.0,
        x[2], y[2], z[2], 0.0,
        0.0, 0.0, 0.0, 1.0);
    var mat2 = mat4.fromValues(1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            -Eye[0], -Eye[1], -Eye[2], 1.0);
    matrix2 = mat4.create();
    mat4.multiply(matrix2, mat1, mat2);

    matrix1 = mat4.create();
    mat4.perspective(matrix1, Math.PI/2.0, 1.0, 0.5, 100);

    completeMatrixMat = mat4.create();
    mat4.multiply(completeMatrixMat, matrix1, matrix2);

    lightColorMod = mat4.fromValues(fixedLightPosition[0], fixedLightPosition[1], fixedLightPosition[2], 1.0,
                                    1.0, 1.0, 1.0, 0.0,
                                    1.0, 1.0, 1.0, 0.0,
                                    1.0, 1.0, 1.0, 0.0);
}

//function to rotate the eye
function rotateEye(direction, angle, p1, p2) {
    temp = vec3.create();
    vec3.cross(temp, direction, p1);
    vec3.scale(temp, temp, Math.sin(angle));

    var scaledVector = vec3.scale(vec3.create(), direction, (1 - Math.cos(angle)) * vec3.dot(direction, p1));
    vec3.add(temp, temp, scaledVector);
    scaledVector = vec3.scale(vec3.create(), p1, Math.cos(angle));
    vec3.add(p1, temp, scaledVector);

    temp = vec3.create();
    vec3.cross(temp, direction, p2);
    vec3.scale(temp, temp, Math.sin(angle));
    scaledVector = vec3.scale(vec3.create(), direction, (1 - Math.cos(angle)) * vec3.dot(direction, p2));
    vec3.add(temp, temp, scaledVector);
    scaledVector = vec3.scale(vec3.create(), p2, Math.cos(angle));
    vec3.add(p2, temp, scaledVector);

    var mat1 = mat4.fromValues(x[0], y[0], z[0], 0.0,
        x[1], y[1], z[1], 0.0,
        x[2], y[2], z[2], 0.0,
        0.0, 0.0, 0.0, 1.0);
    var mat2 = mat4.fromValues(1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            -Eye[0], -Eye[1], -Eye[2], 1.0);
    matrix2 = mat4.create();
    mat4.multiply(matrix2, mat1, mat2);
    
    mat4.multiply(completeMatrixMat, matrix1, matrix2);
}

//function to translate the eye
function translateEye(trans, direction) {
    var scaledVector = vec3.scale(vec3.create(), direction, trans);
    vec3.add(Eye, Eye, scaledVector);

    for (var i = 0; i < triangleSet.length; i++) 
        triangleSet[i].setEyeColor();
    
    var mat1 = mat4.fromValues(x[0], y[0], z[0], 0.0,
        x[1], y[1], z[1], 0.0,
        x[2], y[2], z[2], 0.0,
        0.0, 0.0, 0.0, 1.0);
    var mat2 = mat4.fromValues(1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            -Eye[0], -Eye[1], -Eye[2], 1.0);
    matrix2 = mat4.create();
    mat4.multiply(matrix2, mat1, mat2);

    mat4.multiply(completeMatrixMat, matrix1, matrix2);
}

//function to select a triangle from the triangle set
var locate = [0, 0];
var selectedKey = -1;
function select(direction, shape) {
    if (selectedKey != -1) 
        selectModel(triangleSet[selectedKey], 1.0 / 1.2);
    var i = locate[shape];
    while (true) {
        i = (triangleSet.length + i + direction) % triangleSet.length;
        if (triangleSet[i].shape == shape) 
            break;
    }
    selectedKey = locate[shape] = i;
    selectModel(triangleSet[selectedKey], 1.2);
}

var pressedKey = null;
var blinn = true;
//part 3, 4, 5, 6
function transformationKeys() {
    var t3;
    switch (pressedKey) {
        case null:
            break;
        //left arrow
        case 37:
            select(-1, 0);
            break;
        //right arrow
        case 39:
            select(1, 0);
            break;
        //space
        case 32:
            if (selectedKey != -1) {
                selectModel(triangleSet[selectedKey], 1.0 / 1.2);
                selectedKey = -1;
            }
            break;
        case 'a':
            translateEye(-0.08, x);
            break;
        case 'd':
            translateEye(0.08, x);
            break;
        case 'w':
            translateEye(0.08, z);
            break;
        case 's':
            translateEye(-0.08, z);
            break;
        case 'q':
            translateEye(0.08, y);
            break;
        case 'e':
            translateEye(-0.08, y);
            break;
        case 'A':
            rotateEye(y, Math.PI/180, x, z);
            break;
        case 'D':
            rotateEye(y, -Math.PI/180, x, z);
            break;
        case 'W':
            rotateEye(x, -Math.PI/180, y, z);
            break;
        case 'S':
            rotateEye(x, Math.PI/180, y, z);
            break;
        case 'b':
            if(selectedKey != -1){
                //console.log(blinn);
                if(blinn){
                    setUpBlinnPhongShader();
                    //console.log("blinn phong called");
                }
                else{
                    setUpPhongShader();
                    //console.log("phong called");
                }
                blinn = !blinn;
            }
            break;
        case 'n':
            if (selectedKey != -1) 
                triangleSet[selectedKey].updateSpecularN();
            break;
        case '1':
            if (selectedKey != -1) 
                triangleSet[selectedKey].updateAmbientColor();
            break;
        case '2':
            if (selectedKey != -1) 
                triangleSet[selectedKey].updateDiffuseColor();
            break;
        case '3':
            if (selectedKey != -1) 
                triangleSet[selectedKey].updateSpecularColor();
            break;
        case 'k':
            if (selectedKey != -1) 
                translateModel(triangleSet[selectedKey], x, -0.08);
            break;
        //semi-colon
        case 59:
            if (selectedKey != -1) 
                translateModel(triangleSet[selectedKey], x, 0.08);
            break;
        case 'o':
            if (selectedKey != -1) 
                translateModel(triangleSet[selectedKey], z, 0.08);
            break;
        case 'l':
            if (selectedKey != -1) 
                translateModel(triangleSet[selectedKey], z, -0.08);
            break;
        case 'i':
            if (selectedKey != -1) 
                translateModel(triangleSet[selectedKey], y, 0.08);
            break;
        case 'p':
            if (selectedKey != -1) 
                translateModel(triangleSet[selectedKey], y, -0.08);
            break;
        case 'K':
            if (selectedKey != -1) 
                rotateModel(triangleSet[selectedKey], y, Math.PI/180);
            break;
        case 58:
            if (selectedKey != -1) 
                rotateModel(triangleSet[selectedKey], y, -Math.PI/180);
            break;
        case 'O':
            if (selectedKey != -1) 
                rotateModel(triangleSet[selectedKey], x, -Math.PI/180);
            break;
        case 'L':
            if (selectedKey != -1) 
                rotateModel(triangleSet[selectedKey], x, Math.PI/180);
            break;
        case 'I':
            if (selectedKey != -1) 
                rotateModel(triangleSet[selectedKey], z, -Math.PI/180);
            break;
        case 'P':
            if (selectedKey != -1) 
                rotateModel(triangleSet[selectedKey], z, Math.PI/180);
            break;
        default:
            break;
    }
    pressedKey = null;
}

function dynamicKeyDown(key) {
    if (key.keyCode != 16 && ((key.keyCode >= 65 && key.keyCode <= 90) || key.keyCode == 186)) {
        if (key.keyCode >= 65 && key.keyCode <= 90) {
            if (key.shiftKey) 
                pressedKey = String.fromCharCode(key.keyCode);
            else 
                pressedKey = String.fromCharCode(key.keyCode + 32);
        } else if (key.keyCode == 186) {
            if (key.shiftKey) 
                pressedKey = 58;
            else 
                pressedKey = 59;
        }
    } else if (key.keyCode >= 48 && key.keyCode <= 57)
        pressedKey = String.fromCharCode(key.keyCode);
    else 
        pressedKey = key.keyCode;
}

function dynamicKeyUp() {
    pressedKey = null;
}

function animate() {
    transformationKeys();
    drawTrianglesFromSet();
    requestAnimationFrame(animate);
}

// ASSIGNMENT HELPER FUNCTIONS
// get the JSON file from the passed URL
function getJSONFile(url, descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET", url, false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now() - startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open " + descr + " file!";
            else
                return JSON.parse(httpReq.response);
        } // end if good params
    } // end try

    catch (e) {
        console.log(e);
        return (String.null);
    }
} // end get json file

// set up the webGL environment
function setupWebGL() {
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers
var triangleSet = [];
function loadTriangles() {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL, "triangles");

    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
            
        var objectCenter = new vec3.fromValues(0.0,0.0,0.0);

        for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
            var coordArray = []; // 1D array of vertex coords for WebGL
            var indices = []; // 1D array of vertex indices for WebGL
            var normalArray = [];
            
            // set up the vertex coord array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++) {
                var vertexArray = inputTriangles[whichSet].vertices[whichSetVert];
                coordArray.push(vertexArray[0], vertexArray[1], vertexArray[2]);
                
                var normalAddArray = inputTriangles[whichSet].normals[whichSetVert];
                normalArray.push(normalAddArray[0], normalAddArray[1], normalAddArray[2]);

                vec3.add(objectCenter, objectCenter, vec3.fromValues(vertexArray[0], vertexArray[1], vertexArray[2]));
            } // end for vertices in set

            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                var triangelArray = inputTriangles[whichSet].triangles[whichSetTri];
                indices.push(triangelArray[0], triangelArray[1], triangelArray[2]);
            } // end for triangles in set

            triangleBufferSize = 3*inputTriangles[whichSet].triangles.length; // total number of tris

            //create object sets for each triangle
            triangleSet.push(new TriangleSet(indices, normalArray, coordArray, triangleBufferSize));

            var colorDetails = inputTriangles[whichSet].material;
            triangleSet[triangleSet.length - 1].setAmbientColor(vec4.fromValues(colorDetails.ambient[0], colorDetails.ambient[1], colorDetails.ambient[2], 1.0));
            triangleSet[triangleSet.length - 1].setDiffuseColor(vec4.fromValues(colorDetails.diffuse[0], colorDetails.diffuse[1], colorDetails.diffuse[2], 1.0));
            triangleSet[triangleSet.length - 1].setSpecularColor(vec4.fromValues(colorDetails.specular[0], colorDetails.specular[1], colorDetails.specular[2], 1.0), colorDetails.n);
            triangleSet[triangleSet.length - 1].setEyeColor();

            vec3.scale(objectCenter, objectCenter, 1.0 / inputTriangles[whichSet].vertices.length);
            triangleSet[triangleSet.length - 1].setSetCenter(objectCenter);
            triangleSet[triangleSet.length - 1].setShape(0);
        } // end for each triangle set
    } // end if triangles found
} // end load triangles

function drawTrianglesFromSet() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < triangleSet.length; ++i) 
        drawTriangle(triangleSet[i]);
}

function drawTriangle(triangle){
    //create vertex buffer in webgl
    triangle.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle.coordArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    //create triangle buffer in webgl
    triangle.triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle.indicesArray), gl.STATIC_DRAW);

    //create normal buffer in webgl
    triangle.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle.normalArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(lightColor, false, lightColorMod);
    gl.uniformMatrix4fv(eyeColor, false, triangle.eyeColor);

    gl.uniformMatrix4fv(matrixForModel, false, triangle.model2matrix);
    var inverseTranspose = mat4.invert(mat4.create(), triangle.model2matrix);
    mat4.transpose(inverseTranspose, inverseTranspose);
    gl.uniformMatrix4fv(inverseModelMatrix, false, inverseTranspose);
    gl.uniformMatrix4fv(completeMatrix, false, completeMatrixMat);

    gl.drawElements(gl.TRIANGLES, triangle.triangleBufferSize, gl.UNSIGNED_SHORT, 0);
}

function setUpPhongShader(){
    var fragmentShader = `
        uniform highp mat4 uniformEye;
        uniform highp mat4 uniformLight;
        
        varying highp vec3 normal;
        varying highp vec3 vertex;
        
        void main(void) {
            //e is normalized direction to eye
            highp vec3 e = normalize(vec3(uniformEye[0]) - vertex);

            //l is normalized direction to light
            highp vec3 l = normalize(vec3(uniformLight[0]) - vertex);
            
            highp vec3 r = reflect(-l, normal);

            highp float zero = 0.0;
            highp vec3 temp_normal;
            if(dot(normal, e) < zero) 
                temp_normal = -normal;
            else
                temp_normal = normal;

            highp mat4 temp_matrix = matrixCompMult(uniformLight, uniformEye);

            highp vec3 color = vec3(temp_matrix[1]) + max(dot(temp_normal, l), 0.0) * vec3(temp_matrix[2]) 
                                        + pow(max(dot(e,r),0.0), 0.5*uniformEye[3][3]) * vec3(temp_matrix[3]);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    var vertexShader = `    
        uniform highp mat4 uniformModel;
        uniform highp mat4 inverseUniformModel;
        uniform highp mat4 uniformFullModel;
    
        attribute highp vec3 vertexNormal;
        attribute highp vec3 vertexPosition;
        
        varying highp vec3 vertex;
        varying highp vec3 normal;

        void main(void) {
            highp vec4 temp = uniformModel * vec4(vertexPosition, 1.0);
            vertex = vec3(temp) / temp[3];

            normal = normalize(vec3(inverseUniformModel * vec4(vertexNormal, 0.0)));

            gl_Position = uniformFullModel * uniformModel * vec4(vertexPosition, 1.0);
        }
    `;

    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fragmentShader); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vertexShader); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                matrixForModel = gl.getUniformLocation(shaderProgram, "uniformModel");
                completeMatrix = gl.getUniformLocation(shaderProgram, "uniformFullModel");
                inverseModelMatrix = gl.getUniformLocation(shaderProgram, "inverseUniformModel");

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition");
                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                
                eyeColor = gl.getUniformLocation(shaderProgram, "uniformEye");
                lightColor = gl.getUniformLocation(shaderProgram, "uniformLight");

                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                gl.enableVertexAttribArray(vertexNormalAttrib);        
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    catch (e) {
        console.log(e);
    } // end catch
}
// setup the webGL shaders using Blinn Phong Illumination
//part 2
function setUpBlinnPhongShader() {
    var fragmentShader = `
        uniform highp mat4 uniformEye;
        uniform highp mat4 uniformLight;
        
        varying highp vec3 normal;
        varying highp vec3 vertex;
        
        void main(void) {
            //e is normalized direction to eye
            highp vec3 e = normalize(vec3(uniformEye[0]) - vertex);

            //l is normalized direction to light
            highp vec3 l = normalize(vec3(uniformLight[0]) - vertex);
            
            //h = (e+l)/|e+l|
            highp vec3 h = normalize(e + l);

            highp float zero = 0.0;
            highp vec3 temp_normal;
            if(dot(normal, e) < zero) 
                temp_normal = -normal;
            else
                temp_normal = normal;

            highp mat4 temp_matrix = matrixCompMult(uniformLight, uniformEye);

            highp vec3 color = vec3(temp_matrix[1]) + max(dot(temp_normal, l), 0.0) * vec3(temp_matrix[2]) 
                                        + pow(max(dot(temp_normal, h), 0.0), uniformEye[3][3]) * vec3(temp_matrix[3]);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    var vertexShader = `    
        uniform highp mat4 uniformModel;
        uniform highp mat4 inverseUniformModel;
        uniform highp mat4 uniformFullModel;
    
        attribute highp vec3 vertexNormal;
        attribute highp vec3 vertexPosition;
        
        varying highp vec3 vertex;
        varying highp vec3 normal;

        void main(void) {
            highp vec4 temp = uniformModel * vec4(vertexPosition, 1.0);
            vertex = vec3(temp) / temp[3];

            normal = normalize(vec3(inverseUniformModel * vec4(vertexNormal, 0.0)));

            gl_Position = uniformFullModel * uniformModel * vec4(vertexPosition, 1.0);
        }
    `;

    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fragmentShader); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vertexShader); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                matrixForModel = gl.getUniformLocation(shaderProgram, "uniformModel");
                completeMatrix = gl.getUniformLocation(shaderProgram, "uniformFullModel");
                inverseModelMatrix = gl.getUniformLocation(shaderProgram, "inverseUniformModel");

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition");
                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                
                eyeColor = gl.getUniformLocation(shaderProgram, "uniformEye");
                lightColor = gl.getUniformLocation(shaderProgram, "uniformLight");

                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                gl.enableVertexAttribArray(vertexNormalAttrib);        
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    catch (e) {
        console.log(e);
    } // end catch
} // end setup shaders

// read triangles in, load them into webgl buffers
function loadUnlitTriangles() {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL, "triangles");

    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indices = []; // 1D array of vertex indices for WebGL
        var colorArray = [];
        
        var vertexNum = 0; // the number of vertices in the vertex buffer
        
        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array
        
        for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
            vec3.set(indexOffset, vertexNum, vertexNum, vertexNum); // update vertex offset

            // set up the vertex coord array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++) {
                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                colorArray = colorArray.concat(inputTriangles[whichSet].material.diffuse);
            } // end for vertices in set

            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd, indexOffset, inputTriangles[whichSet].triangles[whichSetTri]);
                indices.push(triToAdd[0], triToAdd[1], triToAdd[2]);
            } // end for triangles in set

            vertexNum += inputTriangles[whichSet].vertices.length; // total number of vertices
            triangleBufferSize += inputTriangles[whichSet].triangles.length; // total number of tris
        } // end for each triangle set
        
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW); // coords to that buffer

        // send the triangle indices to webGL
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); // indices to that buffer

        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);
    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {

    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec3 fragColor;

        void main(void) {
            gl_FragColor = vec4(fragColor, 1.0); // all fragments are white
        }
    `;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        precision mediump float;
        attribute vec3 vertexPosition;
        attribute vec3 vertexColor;
        varying vec3 fragColor;

        void main(void) {
            fragColor = vertexColor;
            gl_Position = vec4(vertexPosition, 1.0); // use the untransformed position
        }
    `;

    try {
        // console.log("fragment shader: "+fShaderCode);

        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition");
                gl.enableVertexAttribArray(vertexPositionAttrib);
                
                colorPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexColor");
                gl.enableVertexAttribArray(colorPositionAttrib); // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try

    catch (e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // activate
    gl.vertexAttribPointer(colorPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    // triangle buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate
    gl.drawElements(gl.TRIANGLES, triangleBufferSize*3, gl.UNSIGNED_SHORT, 0); // render
} // end render triangles


/* MAIN -- HERE is where execution begins after window load */
var light = true;
function main() {
    setupWebGL(); // set up the webGL environment
    
    if(light){
        loadTriangles(); // load in the triangles from tri file
        setUpBlinnPhongShader(); // setup the webGL shaders
        initializaMatrices();

        document.addEventListener("keydown", dynamicKeyDown);
        document.addEventListener("keyup", dynamicKeyUp);
        
        requestAnimationFrame(animate);
    }
    else{
        loadUnlitTriangles();
        setupShaders();
        renderTriangles();
    }
} // end main