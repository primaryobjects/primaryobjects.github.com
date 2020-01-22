// Main React render hook.
$(function() {
  const isolationCtrl = ReactDOM.render(
    <div>
      <IsolationContainer width="3" height="3"></IsolationContainer>
    </div>,
    document.getElementById('root')
  );
});
