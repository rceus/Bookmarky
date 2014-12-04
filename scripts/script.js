var bookmarks = [];

/* https://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object */
function clone(obj) {
    var copy;
 
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;
 
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
 
    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
 
    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }
 
    throw new Error("Unable to copy obj! Its type isn't supported.");
}


function Bookmark(path) {
    this.getLinks = function () {
        var request = new XMLHttpRequest();
        request.open("GET", this.path, false);
        request.send(null);

        var doc = document.implementation.createHTMLDocument();
        doc.documentElement.innerHTML = request.responseText;
        this.html = $.parseHTML(doc.documentElement.innerHTML);

        var bookmarkHtml = $('#bookmarkHtml');
        bookmarkHtml.append(this.html);

        var linksAcc = [];
        $("a").each(function (index) {
            var name = $(this).text();
            var href = $(this).attr("href");
            var icon = $(this).attr("icon");

            var addDateUnixTimeStamp = $(this).attr("add_date");
            var addDate = new Date(addDateUnixTimeStamp * 1000);


            /* "Helper" attributes */

            //http://scratch99.com/web-development/javascript/how-to-get-the-domain-from-a-url/
            var urlParts = href.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/);
            var domain = urlParts[0];
            var month = addDate.getMonth();
            var firstDay = new Date(addDate.getFullYear(), month, 1);
            var lastDay = new Date(addDate.getFullYear(), month + 1, 0);

            link = {
                name: name,
                href: href,
                domain: domain,
                icon: icon,
                add_date: addDate,
                month: month,
                firstDay: firstDay,
                lastDay: lastDay
            };

            linksAcc[linksAcc.length] = link;
        });

        this.links = linksAcc;
        linksAcc = [];

        bookmarkHtml.empty();
    };

    this.compare = function(bookmark) {
        //create an 2D array of bookmarks called top5 - done
        //1st Param: Score 2nd Param: Bookmark Object
        //Iterate through all bookmarks
            //make a score variable and a dictionary
            //for all domains in input create a hash table [domain, 5]
            //iterate through all elems of the ith bookmark object
            //change score everytime we find a exact domain
            //check if one of the top5 is less than the score
            //add
            //else
            //i++
        //return this top5 array
        var top_five_match = [[0, undefined],[0, undefined],[0, undefined],[0, undefined],[0, undefined]];
        var hashTable = {};
 
        var links = this.links;
        for (var j = 0; j < links.length; j++) {
            if(hashTable.hasOwnProperty(links[j].domain)){
                hashTable[links[j].domain]=hashTable[links[j].domain] + 1;
            }else{
                hashTable[links[j].domain]=1;
            }
        }
 
        var dup = clone(hashTable);
        //console.log(hashTable);
        //console.log(dup);
        for (var i = 0; i < bookmarks.length; i++) {
            //console.log(i);
            links = bookmarks[i].links;
            var score = 0;
            hashTable = clone(dup);
            //console.log(hashTable);
            for (j = 0; j < links.length; j++) {
                if(links[j].domain in hashTable)
                {
                    score = score + 1;
                    hashTable[links[j].domain]=hashTable[links[j].domain]-1;
                    if(hashTable[links[j].domain]==0)
                    {
                        delete hashTable[links[j].domain];
                    }
                }
            }
            for (var k = 0; k < top_five_match.length; k++)
            {
                if(top_five_match[k][0] < score)
                {
                    //console.log(k);
                    top_five_match[k][0] = score;
                    top_five_match[k][1] = links;
                    break;
                }
            }
        }
 
        return top_five_match;
    };

    this.path = path;
    this.getLinks();
}

var rankings = [];

function initializeRankings(rankings) {
    for (var i = 0; i < 12; i++) {
        rankings[i] = [];
    }
}

function rankBookmarks(rankings, bookmark) {
    var links = bookmark.links;

    for (var l = 0; l < links.length; l++) {
        var month = links[l].month;

        if (isNaN(month)) {
            return;
        }

        /* Check if bookmark link is already in rankings[] */
        var inRankings = false;
        for (var r = 0; r < rankings[month].length; r++) {
            if (links[l].domain === rankings[month][r].domain) {
                inRankings = true;
                rankings[month][r].count += 1;
                rankings[month][r].urls.push({url: links[l].href, name: links[l].name});
            }
        }

        /* If bookmark link is not in rankings[], add it to it */
        if (inRankings === false) {
            rankings[month].push(
                {
                    domain: links[l].domain,
                    count: 1,
                    firstDay_day: links[l].firstDay.getDate(),
                    firstDay_month: links[l].firstDay.getMonth(),
                    firstDay_year: links[l].firstDay.getFullYear(),
                    lastDay_day: links[l].lastDay.getDate(),
                    lastDay_month: links[l].lastDay.getMonth(),
                    lastDay_year: links[l].lastDay.getFullYear(),
                    urls: [{url: links[l].href, name: links[l].name}]
                });
        }
    }
}

function sortRankings(rankings) {

    for (var i = 0; i < rankings.length; i++) {
        rankings[i].sort(function(a, b) {
            var keyA = a.count;
            var keyB = b.count;

            //Compare the 2
            if (keyA < keyB)
                return 1;
            if (keyA > keyB)
                return -1;

            return 0;
        });
    }
}

$('document').ready(function () {
    var bookmarksFolder = 'bookmarks';

    $.ajax({
        url: "http://localhost/final/" + bookmarksFolder + "/",
        success: function (data) {
            $(data).find("a:contains(.html)").each(function () {
                // will loop through
                var file = $(this).attr("href");
                bookmarks[bookmarks.length] = new Bookmark("http://localhost/final/" + bookmarksFolder + "/" + file);
            });

            //for (var i = 0; i < bookmarks.length; i++) {
            //    console.log(bookmarks[i].path + "'s bookmarks");
            //    console.log(bookmarks[i].links);
            //}

            initializeRankings(rankings);
            for (i = 0; i < bookmarks.length; i++) {
                rankBookmarks(rankings, bookmarks[i]);
            }
            sortRankings(rankings);

            console.log("Rankings:");
            console.log(rankings);
            init();
            console.log(bookmarks[4].compare());
        }
    });
});

var user_bookmark;

function loadBookmark(file){
    console.log("path: " + file);
    user_bookmark = new Bookmark(file);
    var compareResultsUser = user_bookmark.compare();
    console.log(compareResultsUser);
}