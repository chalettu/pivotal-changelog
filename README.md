# pivotal-changelog

#Installation

Requirements: Node  
or Docker  

To Develop or run locally  
* Git clone repo  
* run npm install
* configure Environment Variables  
* run npm start

#Configuration Variables
The application can be configured in one of two ways.  
1. You can specify a formatted json file in conf/config.json like below  
2. You could create an environmental variable named CONFIG and make it contain a json string that matches to format below.

```
{
    "projects":[12345],
    "pivotal_api_token":"xxxxx",
    "postmark_api_key":"xxxx",
    "sender_address":"test@test.com",
    "recipient_address":"test@test.com"
}
```  
#Docker image usage
If you would like to run this in a container and do not need to update the code base, please view the image at [https://hub.docker.com/r/chaleninja/pivotal-changelog](https://hub.docker.com/r/chaleninja/pivotal-changelog) 


## License

See [LICENSE.txt](LICENSE.txt)