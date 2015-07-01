var AWS = require("aws-sdk");
 var os = require("os");
 var crypto = require('crypto');
 var fs = require('fs');
 var helpers = require("./helpers"); 
 AWS.config.loadFromPath('./config.json');
 var s3 = new AWS.S3();
 var sqs=new AWS.SQS(); var Jimp = require("jimp"); 
 var simpledb = new AWS.SimpleDB();
 var adrkolejki = 'https://sqs.us-west-2.amazonaws.com/983680736795/WozniakSQS';
 var modify = function(){
        
        var params = {
                QueueUrl: adrkolejki,
                AttributeNames: ['All'],
                MaxNumberOfMessages: 1,
                MessageAttributeNames: ['key','bucket'],
                VisibilityTimeout: 10,
                WaitTimeSeconds: 0
        };
        
        sqs.receiveMessage(params, function(err, data) {
        if (err) {
                console.log(err, err.stack); 
        }
        else {
                
                if(!data.Messages) {
                        console.log("Brak wiadomości w kolejce");
                } else {
                       
                        var ReceiptHandle_forDelete = data.Messages[0].ReceiptHandle;
                       
                        var wiadomosc = JSON.parse(data.Messages[0].Body);
                        console.log("Otrzymana wiadomosc: bucket - "+wiadomosc.bucket+", key - "+wiadomosc.key);
                     
                        var params2 = {
                                Bucket: wiadomosc.bucket,
                                Key: wiadomosc.key
                        };
                     
                        var file = require('fs').createWriteStream("tmp/"+wiadomosc.key.substring(13));
                        var requestt = s3.getObject(params2).createReadStream().pipe(file);
                       

                        requestt.on('finish', function (){
                                console.log('zapis poprawny'); 
                var zdj=new Jimp("tmp/"+wiadomosc.key.substring(13), function (err, image) {
                this.greyscale();
                this.write("edytowany.jpg");
                });

                                        var fileStream = require('fs').createReadStream("edytowany.jpg");
                                        fileStream.on('open', function () {
                                                var paramsu = {
                                                        Bucket: wiadomosc.bucket,
                                                        Key: 'processed/'+wiadomosc.key.substring(13),
                                                        ACL: 'public-read',
                                                        Body: fileStream,
                                                };
                                                s3.putObject(paramsu, function(err, datau) {
                                                if (err) {
                                                        console.log(err, err.stack);
                                                }
                                                else {
                                                        console.log(datau);
                                                        console.log('zuploadowano');
                                                                var params = {
                                                                  QueueUrl: adrkolejki,
                                                                  ReceiptHandle: ReceiptHandle_forDelete
                                                                };
                                                                sqs.deleteMessage(params, function(err, data) {
                                                                  if (err) console.log(err, err.stack); 
                                                                  else console.log("Usunieto wiadomosc z kolejki: "+data); 
                                                                });
                                                        }
                                                });
                                        });
                                                        });
                                                }
                        }
                });
                setTimeout(modify, 10000);
        }
modify();
