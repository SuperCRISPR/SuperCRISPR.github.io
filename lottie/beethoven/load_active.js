var anim1 = lottie.loadAnimation({
    container: document.getElementById("Animation1"), // 容器
    renderer: "svg",
    loop: true,
    autoplay: true,
    path:
      "../../lottie/beethoven/beethoven_Large.json" // the path to the animation json
  });

  function mouseover(x){
    anim1.setSpeed(2.5);
  }
  function mouseleave(x){
    anim1.setSpeed(1.0);
  }