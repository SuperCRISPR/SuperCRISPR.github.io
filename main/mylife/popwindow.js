

function img_mouseover(x)
{
    x.style.cursor='pointer';
}

function updateImage(id) /*加载图片 */
{
    var img_content=document.getElementById("pop_image_content");
    img_content.src=id;
}

function updateText(id) /*加载文本 */
{
     var text=document.getElementById("pop_text_content");
     var p=" ";
     $.get(id,function(data) {    
        /*text.innerHTML=data;*/
        var lines = data.split("\n");
        lines.forEach(function(element) {
            p=p+element+"<br>";
        });
        text.innerHTML=p;
    });
    
}

/*显示弹窗*/
function showPopup(id)
{
    var popUp = document.getElementById("popupcontent");
    var background = document.getElementById("blur_background");
    var text = document.getElementById("pop_text");
    var img = document.getElementById("pop_image");

    /*使容器中image与text容器的高度与父容器相匹配 */
    var popUp_height_num = popUp.offsetHeight; /*格式为number，单位“px” */
    text_height_num = Number(popUp_height_num)*0.90;
    var img_height_num = Number(popUp_height_num)*0.90;
    text.style.height = text_height_num + "px";
    img.style.height = img_height_num + "px";

    var image_id = "./album/"+id+"/1.png";
    var text_id = "./album/"+id+"/information.txt";

    popUp.style.visibility = "visible";
    background.style.visibility = "visible";

    updateImage(image_id);
    updateText(text_id);
}


/*关闭弹窗 */
function hidePopup()
{
    var popUp = document.getElementById("popupcontent");
    var background = document.getElementById("blur_background");
    popUp.style.visibility = "hidden";
    background.style.visibility = "hidden";
}


