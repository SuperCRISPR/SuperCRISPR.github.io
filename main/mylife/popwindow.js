
function img_mouseover(x)
{
    x.style.cursor='pointer';
}

function updateImage(id) /*加载图片 */
{
    var img_content=document.getElementById("pop_image");
    var p = "<a href=\"" + id + "\" target=\"_blank\">";
    p = p + "<img id=" + "\"pop_image_content\"" + " src=\"" + id + "\"  alt=\"./album/Loading.gif\">" + "</img>";
    p = p + "</a>";
    img_content.innerHTML= p ;
}

function updateVideo(id) /*加载视频 */
{
    var mp4_content=document.getElementById("pop_image");
    var p = "<video width=\"100%\" height=\"100%\" controls loop>";
    p = p + "<source src=\"" + id + "\" type=\"video/mp4\"></source>";
    p = p + "<video> is not supported by your browser.";
    p = p + "</video>";
    mp4_content.innerHTML=p;
}

function updateText(id) /*加载文本 */
{
     var text=document.getElementById("pop_text");
     var p=" ";
     $.get(id,function(data) {    
        /*text.innerHTML=data;*/
        var lines = data.split("\n");
        lines.forEach(function(element) {
            p=p+element+"<br>";
        });
        text.innerHTML="<p id=" + "\"pop_text_content\"" + ">" + p + "</p>";
    });
    
}

/*显示弹窗*/
function showPopup(id, IsVideo=false)
{
    var popUp = document.getElementById("popupcontent");
    var background = document.getElementById("blur_background");
    var text = document.getElementById("pop_text");
    var img = document.getElementById("pop_image");
    var hidden=document.getElementById("hidden_information");

    /*使容器中image与text容器的高度与父容器相匹配 */
    var popUp_height_num = popUp.offsetHeight; /*格式为number，单位“px” */
    text_height_num = Number(popUp_height_num)*0.90;
    var img_height_num = Number(popUp_height_num)*0.90;
    text.style.height = text_height_num + "px";
    img.style.height = img_height_num + "px";

    text.innerHTML="<p id=" + "\"pop_text_content\"" + ">" + "Loading ... ... <br><br>" + "</p>"; 
    text.innerHTML=text.innerHTML + "<p id=" + "\"pop_text_content\"" + ">" +"Maybe I am too lazy to put some introduction here. <br><br> Forgive me..." + "</p>";
    img.innerHTML="<img id=" + "\"pop_image_content\"" + "src=\"./album/Loading.gif\">" + "</img>";

    if (IsVideo==false)
    {
        var image_id = "./album/"+id+"/1.png";
        var text_id = "./album/"+id+"/information.txt";
    
        popUp.style.visibility = "visible";
        background.style.visibility = "visible";
    
        updateImage(image_id);
        updateText(text_id);
    
        hidden.innerHTML = "image: " + id;
    }
    else
    {
        var image_id = "./album/"+id+"/1.mp4";
        var text_id = "./album/"+id+"/information.txt";
    
        popUp.style.visibility = "visible";
        background.style.visibility = "visible";
    
        updateVideo(image_id);
        updateText(text_id);
    
        hidden.innerHTML = "video: " + id;
    }

}


/*关闭弹窗 */
function hidePopup()
{
    var popUp = document.getElementById("popupcontent");
    var background = document.getElementById("blur_background");
    popUp.style.visibility = "hidden";
    background.style.visibility = "hidden";
}
