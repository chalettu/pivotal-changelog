var Q = require("q");
var local_config = require("./conf/config.json");
var config=local_config;
var json2csv = require('json2csv');
var postmark = require("postmark");
var rp = require('request-promise');

var client = new postmark.Client(config.postmark_api_key);
var pivotal_base_url='https://www.pivotaltracker.com/services/v5/';
var projects=config.projects;
var pivotal_api_token=config.pivotal_api_token;



//trendnet dual ac router gigabit
//actiontek f2300 router

//[@project.name, key.name, labels.join(','), key.url] if key.current_state == 'accepted'
projects.forEach(function (project) {

    var url = pivotal_base_url + 'projects/' + project + '/iterations';
    var body = {};
    var options = build_pivotal_rest_request(url, body);
    options.method = "GET";

    rp(options).then(function (parsedBody) {
      //  console.log(parsedBody);
    });

    //2  /projects/{project_id}/iterations/



});
var project_name="";
var stories=[];
var url = pivotal_base_url + 'projects/1876659/';
var body = {};
var options = build_pivotal_rest_request(url, body);
options.method = "GET";
rp(options).then(function (project) {
    project_name = project.name;
    var url = pivotal_base_url + 'projects/1876659/iterations/2';
    var body = {};
    var options = build_pivotal_rest_request(url, body);
    options.method = "GET";
    rp(options).then(function (iteration) {
        iteration.stories.forEach(function (story) {
            if (story.current_state === 'accepted'){
                stories.push(get_story(project_name, story));
            }
        });
        var csvs="";
        
        csvs=generate_csv(stories);
        send_email(csvs);
        // generate_csv(stories);
    });
});

function get_story(project_name, story) {
    var labels = get_labels(story.labels);
   // console.log(story);
    var story_obj = {
        "project_name": project_name,
        "issue_name": story.name,
        "labels": labels,
        "url":story.url
    }
    return story_obj;
}
function generate_csv(stories){

var fields = ['project_name', 'issue_name', 'labels',"url"];
var csv_file = json2csv({ data: stories, fields: fields });
return csv_file;
}
function get_labels(labels){
    var label_list=[];
    labels.forEach(function(label){
        label_list.push(label.name);
    })
    return label_list.join();
}
function send_email(csvs) {


    client.sendEmail({
        "From": config.sender_address,
        "To": "chris.hale@me.com",
        "Subject": "Test",
        "TextBody": "Test Message",
        "Attachments": [{
            "Content": new Buffer(csvs).toString('base64'),
            "Name": "test.csv",
            "ContentType": "text/csv"
        }]
    }, function (error, success) {
        if (error) {
            console.error("Unable to send via postmark: " + error.message);
            return;
        }
        console.info("Sent to postmark for delivery")
    });

}
function build_pivotal_rest_request(url, body) {
    var options = {
        uri: url,
        method: 'POST',
        headers: {
            'X-TrackerToken': pivotal_api_token
        },
        body: body,
        json: true // Automatically stringifies the body to JSON
    };
    return options;
}