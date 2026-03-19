const params = new URLSearchParams(location.search);
const id = params.get("id");

const title = document.getElementById("title");
const desc = document.getElementById("desc");

let text = "我要搭配";

if(id==="guilu-gao"){
  title.innerText="龜鹿膏";
  desc.innerText="日常補養使用";
  text="龜鹿膏_官網";
}

if(id==="guilu-drink"){
  title.innerText="龜鹿飲";
  desc.innerText="方便即飲";
  text="龜鹿飲_官網";
}

if(id==="guilu-soup"){
  title.innerText="龜鹿湯塊";
  desc.innerText="料理搭配";
  text="龜鹿湯塊_官網";
}

document.getElementById("line-btn").href =
`https://lin.ee/sHZW7NkR?text=${encodeURIComponent(text)}`;
