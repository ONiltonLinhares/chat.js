var app = require('http').createServer(resposta);
var fs = require('fs');
const { type } = require('os');
var io = require('socket.io')(app);
var usuarios = [];
let historico = []

app.listen(3000);
console.log("Aplicação está em execução...");

function resposta (req, res) {
     var arquivo = ''
     if (req.url == '/'){
          arquivo = __dirname + '/index.html';
     }else{
          arquivo = __dirname + req.url;
     }
     fs.readFile(arquivo,
          function(err, data){
               if (err){
                    res.writeHead(404);
                    return res.end('Pagina ou arquivo não encontrado!');
               }

               res.writeHead(200);
               res.end(data)
          }
     );
}

io.on("connection", function(socket){

     socket.on('entrar', function(apelido, callback){
          if(!(apelido in usuarios)){
               socket.apelido = apelido;
               usuarios[apelido] = socket;
               
               io.sockets.emit('atualizar usuarios', Object.keys(usuarios));
               io.sockets.emit('atualizar mensagens', {msg: "[ " + pegarDataAtual() + " ] " + apelido + " acabou de entrar na sala", tipo: 'sistema'});
               historico.push({msg: "[ " + pegarDataAtual() + " ] " + apelido + " acabou de entrar na sala", tipo: 'sistema'})

               callback(true);
          }else{
               callback(false);
          }
     });

     socket.emit('historico', historico)

     socket.on("enviar mensagem", function(dados, callback){

          var mensagem_enviada = dados.msg;
          var usuario = dados.usu;
           if(usuario == null)
             usuario = '';
       
             mensagem_enviada = "[ " + pegarDataAtual() + " ] " + socket.apelido + " diz: " + mensagem_enviada;
       
              if(usuario == ''){
                     io.sockets.emit("atualizar mensagens", {msg: mensagem_enviada, tipo:'' });
                     historico.push({msg: mensagem_enviada, tipo:'' })
              }else{
                     socket.emit("atualizar mensagens", {msg: mensagem_enviada, tipo:'privada' });
                     usuarios[usuario].emit("atualizar mensagens", {msg: mensagem_enviada, tipo:'privada' });
                     historico.push({msg: mensagem_enviada, tipo:'privada' })
              }
       
              callback();
     });

     socket.on('disconnect', function(){
          delete usuarios[socket.apelido];
          io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
          io.sockets.emit("atualizar mensagens", {msg: "[ " + pegarDataAtual() + " ] " + socket.apelido + " saiu da sala", tipo: 'sistema'});
          historico.push({msg: "[ " + pegarDataAtual() + " ] " + socket.apelido + " saiu da sala", tipo: 'sistema'})
     });
});

function pegarDataAtual(){
  var dataAtual = new Date();
  var dia = (dataAtual.getDate()<10 ? '0' : '') + dataAtual.getDate();
  var mes = ((dataAtual.getMonth() + 1)<10 ? '0' : '') + (dataAtual.getMonth() + 1);
  var ano = dataAtual.getFullYear();
  var hora = (dataAtual.getHours()<10 ? '0' : '') + dataAtual.getHours();
  var minuto = (dataAtual.getMinutes()<10 ? '0' : '') + dataAtual.getMinutes();
  var segundo = (dataAtual.getSeconds()<10 ? '0' : '') + dataAtual.getSeconds();

  var dataFormatada = dia + "/" + mes + "/" + ano + " " + hora + ":" + minuto + ":" + segundo;
  return dataFormatada;
}