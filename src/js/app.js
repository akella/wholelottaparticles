import * as THREE from 'three';
import {TimelineMax} from 'gsap';
var OrbitControls = require('three-orbit-controls')(THREE);



var camera, pos, controls, scene, renderer, geometry, geometry1, material;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  renderer = new THREE.WebGLRenderer();



  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerWidth);

  var container = document.getElementById('container');
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.001, 100
  );
  camera.position.set( 0, 0, 1 );


  controls = new OrbitControls(camera, renderer.domElement);




  function loadImages(paths,whenLoaded) {
    var imgs=[];
    paths.forEach(function(path) {
      var img = new Image;
      img.onload = function() {
        imgs.push(img);
        if (imgs.length===paths.length) whenLoaded(imgs);
      };
      img.src = path;
    });
  }

  let images = ['img/1.jpg','img/2.jpg'];

  let obj = [];
  images.forEach((img) => {
    obj.push({file:img});
  });
  console.log(obj);
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  document.body.appendChild(canvas);


  loadImages(images,function(loadedImages) {


    obj.forEach((image,index) => {
      let img = loadedImages[index];

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      ctx.drawImage(img,0,0);

      

      let data = ctx.getImageData(0,0,canvas.width,canvas.height);

      let buffer = data.data;


      let rgb = [];
      let c = new THREE.Color();

      for (var i = 0; i < buffer.length; i=i+4) {
        c.setRGB(buffer[i],buffer[i+1],buffer[i+2]);
        rgb.push({c: c.clone(),id: i/4});
      }

      console.log(rgb);

      let result = new Float32Array(img.width*img.height*2);
      let j = 0;

      rgb.sort( function( a, b ) {
        return a.c.getHSL().s - b.c.getHSL().s;
      });

      rgb.forEach(e => {
        result[j] = e.id % img.width;
        result[j+1] = Math.floor(e.id / img.height);
        j= j +2;
      });

      console.log(result,'result');

      obj[index].image = img;
      obj[index].texture = new THREE.Texture(img);
      obj[index].buffer = result;
      obj[index].texture.needsUpdate = true;
      obj[index].texture.flipY = false;
    });
    

    console.log(obj);


    var w = loadedImages[0].width;
    var h = loadedImages[0].height;

    let positions = new Float32Array(w*h*3);
    let index = 0;
    for (var i = 0; i < w; i++) {
      for (var j = 0; j < h; j++) {
        positions[index*3] = j;
        positions[index*3+1] = i;
        positions[index*3+2] = 0;
        index++;
      }
    }

    let geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(positions,3));

    geometry.addAttribute('source',new THREE.BufferAttribute(obj[0].buffer,2));
    geometry.addAttribute('target',new THREE.BufferAttribute(obj[1].buffer,2));

    material = new THREE.RawShaderMaterial( {
      uniforms: {
        sourceTex: { type: 't', value: obj[0].texture },
        targetTex: { type: 't', value: obj[1].texture },
        blend: { type: 'f', value: 0 },
        size: { type: 'f', value: 2.1 },//window.devicePixelRatio },
        dimensions: { type: 'v2', value: new THREE.Vector2(w,h) }
      },
      vertexShader: document.getElementById( 'particle-vs' ).textContent,
      fragmentShader: document.getElementById( 'particle-fs' ).textContent,
    });

    let points = new THREE.Points(geometry,material);
    scene.add(points);



    let tl = new TimelineMax({paused:true});
    console.log(material);
    tl
      .to(material.uniforms.blend,3,{value:1},0);
    $('body').on('click',() => {
      
      if($('body').hasClass('done')) {
        tl.reverse();
        $('body').removeClass('done');
      } else{
        tl.play();
        $('body').addClass('done');
      }
    });

  });

  			

  resize();
    

 
}


function resize() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  renderer.setSize( w, h );
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let time = 0;
function animate() {
  time++;
  
  requestAnimationFrame(animate);
  render();
}

function render() {
  renderer.render(scene, camera);
}

init();
animate();
