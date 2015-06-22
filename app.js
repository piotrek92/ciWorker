var AWS = require("aws-sdk");
 var os = require("os");
 var crypto = require('crypto');
 var fs = require('fs'); //zawiera funkcje pomocnicze generowania skrótów robienia z jonson obiektu ...
 var helpers = require("./helpers"); //accessKeyId ... klucze do amazona
 AWS.config.loadFromPath('./config.json'); //obiekt dla instancji S3 z aws-sdk
 var s3 = new AWS.S3();
 var sqs=new AWS.SQS(); var Jimp = require("jimp"); //obiekt do obsługi simple DB z aws-sdk
 var simpledb = new AWS.SimpleDB();
 var linkKolejki = 'https://sqs.us-west-2.amazonaws.com/983680736795/WozniakSQS';
 var modify = function(){
        //parametr do funkcji pobierającej wiadomość z kolejki
        var params = {
                QueueUrl: linkKolejki,
                AttributeNames: ['All'],
                MaxNumberOfMessages: 1,
                MessageAttributeNames: ['key','bucket'],
                VisibilityTimeout: 10,//na tyle sec nie widac jej w kolejce
                WaitTimeSeconds: 0//to na 0
        };
        //odbiera wiadomość
        sqs.receiveMessage(params, function(err, data) {
        if (err) {
                console.log(err, err.stack); // an error occurred
        }
        else {
                //console.log(JSON.stringify(data, null, 4));
                //Czy jest jakaś wiadomość
                if(!data.Messages) {
                        console.log("No message in queue.");
                } else {
                        //pobranie danych z body wiadomosci w kolejce i zrobienie z nich tablicy
                        //handler do ussunięcia wiadomości z kolejki
                        var ReceiptHandle_forDelete = data.Messages[0].ReceiptHandle;
                        //{bucket, key}
                        var messageinfo = JSON.parse(data.Messages[0].Body);
                        console.log("Otrzymano wiadomosc: bucket - "+messageinfo.bucket+", key - "+messageinfo.key);
                        //to samo co wyzej tylko pobiera dane z metadanych a nie z body
                        //var messageinfo = { "bucket":data.Messages[0].MessageAttributes.bucket.StringValue,"key":data.Messages[0].MessageAttributes.key.StringValue}console.log(messageinfo.bucket);
                        //parametry do pobrania pliku (obiektu)
                        var params2 = {
                                Bucket: messageinfo.bucket,
                                Key: messageinfo.key
                        };
                        //zapisujemy plik z s3 na dysku
                        var file = require('fs').createWriteStream("tmp/"+messageinfo.key.substring(13));
                        var requestt = s3.getObject(params2).createReadStream().pipe(file);
                        //po zapisie na dysk

                        requestt.on('finish', function (){
                                console.log('jestem tu po zapisaniu pliku na dysk'); ////////////////////////////////////
                var zdj=new Jimp("tmp/"+messageinfo.key.substring(13), function (err, image) {
                this.greyscale();
                this.write("tmp/"+messageinfo.key.substring(13));
                });

                                        var fileStream = require('fs').createReadStream("tmp/"+messageinfo.key.substring(13));
                                        fileStream.on('open', function () {
                                                var paramsu = {
                                                        Bucket: messageinfo.bucket,
                                                        Key: 'processed/'+messageinfo.key.substring(13),
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
                                                                  QueueUrl: linkKolejki,
                                                                  ReceiptHandle: ReceiptHandle_forDelete
                                                                };
                                                                sqs.deleteMessage(params, function(err, data) {
                                                                  if (err) console.log(err, err.stack); // an error occurred
                                                                  else console.log("Usunieto wiadomosc z kolejki: "+data); // successful response
                                                                });
                                                        }
                                                });
                                        });
                                                        });
                                                }
                        }
                });
        }
modify();
