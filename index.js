// 实现导航栏粘性粘贴功能//

// 当用户滚动页面时，执行 myFunction
window.onscroll = function() {stickyRoll()};
// Get the navbar
var navbar = document.getElementById("navbar");
// 获取导航栏的偏移位置
var sticky = navbar.offsetTop;
// 当到达滚动位置时，将粘性类添加到导航栏。 离开滚动位置时删除 "sticky"
function stickyRoll() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky")
  } else {
    navbar.classList.remove("sticky");
  }
}

// 实现导航栏粘性粘贴功能--over//