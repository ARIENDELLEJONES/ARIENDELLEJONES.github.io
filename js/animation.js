const images = document.querySelectorAll(".float-img");

images.forEach(img=>{

img.addEventListener("mouseover",()=>{

img.style.transform="scale(1.05)";
img.style.transition="0.5s";

});

img.addEventListener("mouseout",()=>{

img.style.transform="scale(1)";

});

});
