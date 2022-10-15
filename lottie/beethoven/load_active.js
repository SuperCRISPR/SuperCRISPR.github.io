var IsPlay=true;

var anim1 = lottie.loadAnimation({
    container: document.getElementById("Animation1"), // 容器
    renderer: "svg",
    loop: true,
    autoplay: true,
    path:
      "../../lottie/beethoven/beethoven_Large.json" // the path to the animation json
  });

  var anim2 = lottie.loadAnimation({
    container: document.getElementById("Animation2"), // 容器
    renderer: "svg",
    loop: true,
    autoplay: true,
    path:
      "../../lottie/beethoven/beethoven_2.json" // the path to the animation json
  });

  var anim3 = lottie.loadAnimation({
    container: document.getElementById("Animation3"), // 容器
    renderer: "svg",
    loop: true,
    autoplay: true,
    path:
      "../../lottie/beethoven/beethoven_3.json" // the path to the animation json
  });

  anim2.hide();
  anim3.hide();

  function mouseover(x){
    x.style.cursor='pointer';
    if(IsPlay==true){
      anim1.setSpeed(2.0);
    }
    else{
      anim2.setSpeed(0.3);
      anim3.show();
    }
  }
  function mouseleave(x){
    x.style.cursor='default';
    if(IsPlay==true){
      anim1.setSpeed(1.0);
    }
    else{
      anim2.setSpeed(1.0);
      anim3.hide();
    }
  }

  function mousedown(x){
    // 当已经在播放时，则暂停并展现动画2
    if(IsPlay==true){
      IsPlay=false;
      anim1.hide();
      anim2.show();
    }
    // 当未播放时，开始播放动画1
    else{
      IsPlay=true;
      anim1.show();
      anim2.hide();
      anim3.hide();
    }
  }