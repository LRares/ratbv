var homeObj = {
  _idButton: '',
  init: function(idButton) {
    this._idButton = idButton;

  }


}


function clickFunction() {
  var button = document.getElementById(homeObj._idButton);
  alert("button got clicked!");

}
