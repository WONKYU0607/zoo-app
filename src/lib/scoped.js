/* 이 화면 안에서만 document 를 보게 한다. 화면 코드를 그대로 옮기기 위한 장치다. */
function scoped(root){
  return {
    getElementById: id => root.querySelector('[id="' + id + '"]'),
    querySelector: s => root.querySelector(s),
    querySelectorAll: s => root.querySelectorAll(s),
    createElement: t => window.document.createElement(t),
    get body(){ return window.document.body },
    get documentElement(){ return window.document.documentElement },
    addEventListener: (...a) => window.document.addEventListener(...a),
  };
}

export { scoped };
