<template>
  <div id='home'>home</div>
</template>

<script>
export default {
  name: 'home',
  created ()  
  {
    const socket = new WebSocket('ws://172.16.0.13:8001/123qwe')
    socket.addEventListener('open', function (event)    
    {
      socket.send('Hello Server!')
      debugger
      console.log(event.a)
    })
    socket.addEventListener('message', function (event)    
    {
      debugger
      console.log('Message from server ', event.data)
    })
    socket.addEventListener('close', function (event)    
    {
      debugger
      console.log('close from server ', event.data)
    })
    socket.addEventListener('error', function (event)    
    {
      debugger
      console.log('error from server ', event.data)
    })
  }
}
</script>

<style>
</style>
