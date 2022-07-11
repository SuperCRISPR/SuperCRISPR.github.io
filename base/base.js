$(function(){
	//点赞
	$(".liker").on("click",function(){
		// 判断是否已经点赞过
		if($(this).hasClass("red")){
			return
		}
		//添加样式 并且数字+1
		$(this).addClass("red")
		var num=$(this).html().substring(1)
		num++
		$(this).html("❤"+num)
		//ajax更新数据
	})
})
