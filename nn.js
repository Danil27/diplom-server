var brain = require('brain.js');
const fs = require("fs");

var app = express();

const config = {
    inputSize: 20,
    inputRange: 20,
    hiddenLayers: [200, 200, 700],
    outputSize: 20,
    learningRate: 0.01,
    decayRate: 0.999,
};

var net = new brain.NeuralNetwork(config);
var slovar = fs.readFileSync("steming.txt", "utf8").toString().split("\r\n");

function vectorFormation(str) {
    mass = [];

    str = str.split(" ");

    for (i = 0; i < slovar.length; i++) {
        mass[i] = 0;
        for (j = 0; j < str.length; j++) {
            if (str[j].indexOf(slovar[i]) >= 0) {
                mass[i] = 1;
            }
        }
    }
    return mass;
}


t1 = "обеспечение безопасности технологического процесса наличие средств обеспечения защиты блокировок и сигнализации производственного оборудования обеспечивающего ";
o1 = [1]; //число к которому приближается ответ нс если текст похож

t2 = "техническое опасного объекта овных фондов достаточность стальных газопроводов от электрохимической коррозии ";
o2 = [0.7];

t3 = "выполнение планов графиков ремонту техническому обслуживанию планов графиков диагностирования технических устройств отработавших нормативный срок приборного обследования";
o3 = [0.3];

t4 = "";
o4 = [0];

net.train([
    { input: vectorFormation(t1), output: o1 },
    { input: vectorFormation(t2), output: o2 },
    { input: vectorFormation(t3), output: o3 },
    { input: vectorFormation(t4), output: o4 }
]);

module.exports.getTextClass = function (text) {
    net.run(vectorFormation(text));
}

