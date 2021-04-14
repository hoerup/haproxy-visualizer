var $ = require('jquery');
var cytoscape = require('cytoscape');
var klay = require('cytoscape-klay');

var cy;

$(function () {
    initCytoscape();

    $("#parsebtn").on('click', function () {
        parseText();
    });
    $("#resetbtn").on('click', function () {
        resetView();
    });

    $("#search").on('change', function() {
        search();
    });


});

function initCytoscape() {

    cytoscape.use(klay);

    cy = cytoscape({
        container: $('#cy'),
        selectionType: 'single',
        minZoom: 0.05,
        maxZoom: 3,

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)',
                    'text-wrap': 'wrap'
                }
            },

            {
                selector: '.frontend',
                style: {
                    'background-color': '#800',
                    'label': 'data(id)',
                    'shape': 'round-rectangle',
                    /*'height': 80,
                    'width': 80,                    
                    'text-wrap': 'wrap',
                    'text-halign': 'center',
                    'text-valign': 'center',*/
                }
            },
            {
                selector: '.frontend:selected',
                style: {
                    'background-color': '#F00',
                }
            },

            {
                selector: '.backend',
                style: {
                    'background-color': '#008',
                    'label': 'data(id)',
                }
            },
            {
                selector: '.backend:selected',
                style: {
                    'background-color': '#00F',
                }
            },
            {
                selector: '.backend.search',
                style: {
                    'background-color': '#000',
                    
                }
            },
            {
                selector: '.hidden',
                css: {
                    'display': 'none'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                }
            },
            {
                selector: 'edge:selected',
                style: {
                    'line-color': '#000',
                    'target-arrow-color': '#000',
                    'text-wrap': 'wrap',
                    'text-background-color': '#ff0',
                    'text-background-opacity': 1,
                    'text-background-padding': '4px',
                    'text-background-shape': 'round-rectangle',
                    'label': 'data(acl)',
                    'z-compound-depth': 'top',
                }
            }


        ]
    }
    );

    cy.on('select', 'node', function (evt) {

        stopBlink();

        var tgt = evt.target[0];

        var allEdges = cy.$("edge");
        allEdges.addClass('hidden');


        var connected = tgt.connectedEdges();
        connected.removeClass('hidden');


        console.log(tgt.id());
    });
    /*cy.on('unselect', 'edge', function (evt) {
        console.log(evt);
    });*/
    cy.on('zoom', function (evt) {
        console.log(cy.zoom());
    });
}

function parseText() {

    stopBlink();

    $("#search").val("");
    cy.remove('node');
    cy.remove('edge');

    var lines = $("#config").val().split("\n");


    var currentName = "";

    var edges = [];
    var acls = {};

    lines.forEach(function (line) {
        line = line.trim();
        words = line.split(' ');
        var keyword = words.shift();

        if (keyword == "frontend") {
            acls = {}; //reset ACLs

            var name = words.shift();
            currentName = name;

            cy.add(
                {
                    group: 'nodes',
                    data: { id: name, },
                    classes: ["frontend"],
                }
            );
        }
        if (keyword == "backend") {
            var name = words.shift();
            currentName = name;

            cy.add(
                {
                    group: 'nodes',
                    data: { id: name },
                    classes: ["backend"],
                }
            );
        }

        if (keyword == "use_backend" || keyword == "default_backend") {
            tgt = words.shift();
            var acl = '';
            if (words.length >= 1 ) {

                if (words[0] == 'if')
                    words.shift();

                acl = words.join(' ');                
                if (acl in acls)
                    acl = acls[acl];
            }

            var edge = {
                source: currentName,
                target: tgt,
                acl: acl
            }

            edges.push(edge);
        }

        if (keyword == "acl") {
            var name = words.shift();
            

            var acl = words.join(' ');
            if (name in acls) 
                acls[name] = acls[name] + "\n" + acl;
            else
                acls[name] = "ACL " + name + ":\n" + acl;
        }

    });

    edges.forEach(function (edge) {
        cy.add(
            { group: 'edges', data: { /*id: 'e1',*/ source: edge.source, target: edge.target, acl: edge.acl} }
        );
    });

    var layout = cy.makeLayout({
        name: 'klay',
        cols: 2,
        klay: {
            direction: 'RIGHT',
            separateConnectedComponents: false
        }
    });

    layout.run();
}

function resetView() {
    $("#search").val("");

    stopBlink();
    
    var allEdges = cy.$("edge");
    allEdges.removeClass('hidden');
    allEdges.unselect();

    var allNodes = cy.$("node");
    allNodes.unselect();

    cy.fit();
}

function search() {
    var search = $("#search").val().trim();;
    

    var allEdges = cy.$("edge");
    var allNodes = cy.$("node");

    if (search == "") {
        stopBlink();
        return;
    }


    allEdges.forEach(function (edge) {
    });
    

    allNodes.forEach(function (node) {

        var id = node.id();        

        if (id.indexOf(search) >=  0) {
            blink(node);
        } else {            
            node.stop();
            node.clearQueue();
            node.style({ opacity: 1});
        }
    });

}

function stopBlink() {
    var allNodes = cy.$("node");

    allNodes.stop();
    allNodes.clearQueue();
    allNodes.style({ opacity: 1});
}

function blink(elem) {    
    for (var i=0; i<50; i++) {
        elem.animate({            
            style: { opacity: 0},
            duration: 500,
            easing: 'ease-in-sine'
        }).delay(0).animate({
            style: { opacity: 1},
            duration: 500,
            easing: 'ease-in-sine'
        });
    }


}