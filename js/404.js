var parallax = function (e) {
  var windowWidth = window.innerWidth;
  if (windowWidth < 768) return;

  var parallax = document.querySelector('.parallax');
  var halfFieldWidth = parallax.offsetWidth / 2;
  var halfFieldHeight = parallax.offsetHeight / 2;
  var fieldPos = parallax.getBoundingClientRect();
  var x = e.pageX;
  var y = e.pageY - fieldPos.top;
  var newX = (x - halfFieldWidth) / 30;
  var newY = (y - halfFieldHeight) / 30;

  var waveElements = document.querySelectorAll('.parallax [class*="wave"]');
  waveElements.forEach(function (element, index) {
    element.style.transition = "";
    element.style.transform = "translate3d(" + index * newX + "px," + index * newY + "px,0px";
  })
},
  stopParallax = function () {
    var waveElements = document.querySelectorAll('.parallax [class*="wave"]');

    waveElements.forEach(function (element) {
      element.style.transform = "translate(0px, 0px)";
      element.style.transition = "all 0.7s";
    })

    setTimeout(function () {
      waveElements.forEach(function (element) {
        element.style.transition = "";
      })
    }, 700)
  }

window.onload = function () {
  document.getElementById("not-found").addEventListener("mousemove", parallax);
  document.getElementById("not-found").addEventListener("mouseleave", stopParallax);
}