const Discord = require("discord.js");
const client = new Discord.Client();
const cron = require("cron");
const JsonBinIoApi = require("jsonbin-io-api");
const api = new JsonBinIoApi(process.env.JSONKEY);
let bank;
let stock;
let point;
api.readBin({
  id: "5f6623aa302a837e95696ae2",
  version: "latest"
})
.then((data) => {
    bank = JSON.parse(data.bank);
    stock = JSON.parse(data.stock);
    point = JSON.parse(data.point);
    console.log(data);
});
let manageChannel = "loading";

function saveData() {
    api.updateBin({
        id: "5f6623aa302a837e95696ae2",
        data: {"bank": JSON.stringify(bank), "stock": JSON.stringify(stock), "point": JSON.stringify(point)},
        versioning: true
    });
}

client.once('ready', () => {
    console.log("ON");
    manageChannel = client.channels.cache.get("731119566641430559");

});

client.on("message", (message) => {
    if (message.content[0] == "!") {
        let input = message.content.split(/(\s+)/).filter(e => e.trim().length > 0);
        if (message.channel.id == "731149706046210118") {
            switch (input[0]) {
                case "!charge":
                    if (point[input[1]]) {
                        point[input[1]] += Number(input[2]);
                    } else {
                        point[input[1]] = Number(input[2]);
                    }
                    manageChannel.send(`
<@${input[1]}>
고객님의 주식 등록권이 ${input[2]}장 충전되었습니다.
                `);
                    break;
                case "!code":
                    if (bank.code.in100.includes(input[2]) || bank.code.in1000.includes(input[2]) || bank.code.in10000.includes(input[2]) || bank.code.out100.includes(input[2]) || bank.code.out1000.includes(input[2]) || bank.code.out10000.includes(input[2])) {
                        message.channel.send("중복");
                    } else {
                        bank.code[input[1]].push(input[2]);
                    }
                    break;
                case "!money":
                    bank.money[input[1]] = bank.money[input[1]] ? bank.money[input[1]] + Number(input[2]) : Number(input[2]);
            }
        } else if (message.channel.id == "731119566641430559") {
            switch (input[0]) {
                case "!help":
                    manageChannel.send(`
[도움말]
!json : 저장된 모든 데이터를 JSON 형태로 출력합니다.
!add [주식회사명] [액면가] [배당금] [배당주기(일 기준)]: 주식 등록권을 사용하여 회사의 주식을 등록합니다.
주식 등록권은 인게임 [코코시티 코코빌딩 701호 DevTuTech 사무실] 에서 구매 가능합니다.
                    `);
                    break;
                case "!json":
                    manageChannel.send(`
point = ${JSON.stringify(point)}
stock = ${JSON.stringify(stock)}
bank.money = ${JSON.stringify(bank.money)}
                    `)
                    break;
                case "!add":
                    if (input[1]) {
                        input[1] = input[1].toUpperCase()
                    } else {
                        manageChannel.send("입력값을 입력하여 주십시오.");
                    }
                    if (!point[message.author.id]) {
                        manageChannel.send("주식 등록권이 없습니다.");
                    } else if (point[message.author.id] < 1) {
                        manageChannel.send("주식 등록권이 부족합니다.");
                    } else if ((input.length != 5) || isNaN(input[2]) || isNaN(input[3]) || isNaN(input[4])) {
                        manageChannel.send(
"이름에 띄어쓰기 사용은 불가능하며, 액면가, 배당금, 배당주기는 수로만 적어주시고 모든 입력값을 적절히 입력해주시기 바랍니다."
                        );
                    } else if (input[1].length > 15) {
                        manageChannel.send("이름은 15자 이하만 가능합니다.");
                    } else if (input[1].match(/[^a-z|A-Z|0-9|가-힣|ㄱ-ㅎ|ㅏ-ㅣ]/g)) {
                        manageChannel.send("이름에는 한글, 영문, 숫자만 사용 가능합니다.");
                    } else if (stock[input[1]]) {
                        manageChannel.send("이미 사용 중인 이름과 동일합니다.");
                    } else if (Number(input[4]) < 1) {
                        manageChannel.send("배당주기는 1일 이상만 가능합니다.");
                    } else {
                        message.guild.channels.create(input[1], {
                            type: "text",
                            permissionOverwrites: [{
                                    id: message.guild.id,
                                    deny: ['SEND_MESSAGES'],
                                }
                            ]
                        }).then(channel => {
                            stock[channel.name.toUpperCase()] = {
                                owner: message.author.id,
                                stock: 0,
                                parValue: Number(input[2]),
                                allocationValue: Number(input[3]),
                                allocationCycle: Number(input[4]),
                                investor: {},
                                dealCount: 0,
                                dealPrice: 0
                            };
                            manageChannel.send(`${channel.name.toUpperCase()} 사의 주식이 등록되었습니다.`);
                            channel.setParent("731125389707051089");
                            channel.send(`
액면가 : ${input[2]}<:diamond:734360722452250674>
배당금 : ${input[3]}<:diamond:734360722452250674>
배당주기 : ${input[4]}일
                            `);
                            channel.send("그래프는 최초의 개인 명의 주식 거래 (!assign) 이후부터 표시됩니다.");
                            message.guild.channels.create(input[1], {
                                type: "text",
                                permissionOverwrites: [{
                                        id: message.guild.id,
                                        deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                                    },
                                    {
                                        id: message.author.id,
                                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                                    }
                                ]
                            }).then(channel => {
                                channel.setParent("734268233515008110");
                                let company = stock[input[1]];
                                message.guild.channels.create(input[1], {
                                    type: "text"
                                }).then(channel => {
                                    channel.setParent("734351211154767872");
                                });
                            });
                        });
                    }
                    break;
                default:
                    manageChannel.send("존재하지 않는 명령어입니다.");
            }
        } else if (message.channel.parent.id == "734268233515008110") {
            switch (input[0]) {
                case "!help":
                    message.channel.send(`
[도움말]
!publish [발행량] : 주식을 발행합니다.
!sell [판매자 태그] [판매량] : 회사 명의로 주식을 판매합니다.
!vote [주제] : 투표를 진행합니다. 투표는 시작하고 약 10분 뒤 마감됩니다.
                    `);
                    break;
                case "!publish":
                    if (!input[1] || isNaN(input[1]) || (Number(input[1]) == Infinity)) {
                        message.channel.send("발행량은 수로 입력해주십시오.")
                    } else {
                        stock[message.channel.name.toUpperCase()].stock += Number(input[1]);
                        message.channel.send(`${message.channel.name.toUpperCase()} 사의 주식이 ${input[1]}장 발행되었습니다.`);
                    }
                    break;
                case "!sell":
                    if (input.length < 3) {
                        message.channel.send("입력값을 모두 입력해주십시오.");
                    } else if (stock[message.channel.name.toUpperCase()].stock < Number(input[2])) {
                        message.channel.send(`
발행된 주식의 수가 부족합니다.
잔여 주식 : ${stock[message.channel.name.toUpperCase()].stock}장
                        `);
                    } else if (!(input[1].startsWith("<@")) || !(input[1].endsWith(">"))) {
                        message.channel.send(`
판매자는 태그로 입력하여 주십시오.
예) !sell <@!731121207256023051> 1
                        `);
                    } else if (isNaN(input[2])) {
                        message.channel.send("판매량은 수로 입력해주십시오.");
                    } else {
                        if (stock[message.channel.name.toUpperCase()].investor[input[1].replace(/[^0-9]/g, "")]) {
                            stock[message.channel.name.toUpperCase()].investor[input[1].replace(/[^0-9]/g, "")] += Number(input[2]);
                        } else {
                            stock[message.channel.name.toUpperCase()].investor[input[1].replace(/[^0-9]/g, "")] = Number(input[2]);

                        }
                        stock[message.channel.name.toUpperCase()].stock -= Number(input[2]);
                        manageChannel.send(`
${input[1]}
${message.channel.name.toUpperCase()} 사의 주식 ${input[2]}장을 성공적으로 구매하셨습니다.
                        `);
                    }
                    break;
                case "!vote":
                    message.channel.send(`
[투표]
${input.slice(1).join(" ")}
찬성 : 0
반대 : 0
반응을 추가해 투표하십시오.
한 번 투표하면 번복이 불가능합니다.
10분 뒤 종료됩니다.
                    `).then((message) => {
                        message.react("⭕");
                        message.react("❌");
                        let pro = 0;
                        let con = 0;
                        let voted = []
                        collector = new Discord.ReactionCollector(message, (reaction, user) => (["⭕", "❌"].includes(reaction.emoji.name)), {time: 600000});
                        collector.on("collect", (reaction, user) => {
                            if (!voted.includes(user.id) && stock[message.channel.name.toUpperCase()].investor[user.id]) {
                                if (reaction.emoji.name == "⭕") {
                                    pro += stock[message.channel.name.toUpperCase()].investor[user.id];
                                } else {
                                    con += stock[message.channel.name.toUpperCase()].investor[user.id];
                                }
                                voted.push(user.id);
                                message.edit(`
[투표]
${input.slice(1).join(" ")}
찬성 : ${pro}
반대 : ${con}
반응을 추가해 투표하십시오.
한 번 투표하면 번복이 불가능합니다.
10분 뒤 종료됩니다.
                                `);
                            }
                        });
                    });
                    break;
                default:
                    message.channel.send("존재하지 않는 명령어입니다.");
            }
        } else if (message.channel.parent.id == "734351211154767872") {
            switch (input[0]) {
                case "!help":
                    message.channel.send(`
[도움말]
!sell [판매량] [1장 당 판매가]
                    `);
                    break;
                case "!sell":
                    if (input.length < 3) {
                        message.channel.send("입력값을 모두 입력해주십시오.");
                    } else if (stock[message.channel.name.toUpperCase()].investor[message.author.id] < Number(input[1])) {
                        message.channel.send(`
보유하고 있는 주식의 수가 부족합니다.
잔여 주식 : ${stock[message.channel.name.toUpperCase()].investor[message.author.id]}장
                        `);
                    } else if (isNaN(input[1]) || isNaN(input[2])) {
                        message.channel.send("판매량과 판매가는 수로 입력해주십시오.");
                    } else {

                    }
                    break;
                default:
                    message.channel.send("존재하지 않는 명령어입니다.");
            }
        } else if (message.channel.id == "755051849530343454") {
            switch (input[0]) {
                case "!help":
                    message.channel.send(`
[도움말]
!money : 자신이 소유한 돈의 수를 표시합니다.
!put [입금 코드] : 당신의 전자계좌에 입금 코드의 가치 만큼의 돈이 입금됩니다.
!get [출금액 (100/1000/10000)] : 출금액 가치 만큼의 코드를 전달받습니다.
!give [유저 태그] [송금액] : 유저 태그 대상 유저에게 송금액 만큼을 송금합니다.
    예) !give <@!DevTuple> 100
!rank : 은행 저축금 랭킹을 보여줍니다.
                    `);
                    break;
                case "!money":
                    message.channel.send(`현재 고객님의 전자계좌에는 ${(bank.money[message.author.id] ? bank.money[message.author.id] : 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}Đ이 저축되어 있습니다.`);
                    break;
                case "!put":
                    if (bank.code.in100.includes(input[1])) {
                        bank.money[message.author.id] = bank.money[message.author.id] ? (bank.money[message.author.id] + 100) : 100;
                        bank.code.in100.splice(bank.code.in100.indexOf(input[1]), 1);
                        message.channel.send("100Đ이 입금되었습니다.");
                    } else if (bank.code.in1000.includes(input[1])) {
                        bank.money[message.author.id] = bank.money[message.author.id] ? (bank.money[message.author.id] + 1000) : 1000;
                        bank.code.in1000.splice(bank.code.in1000.indexOf(input[1]), 1);
                        message.channel.send("1,000Đ이 입금되었습니다.");
                    } else if (bank.code.in10000.includes(input[1])) {
                        bank.money[message.author.id] = bank.money[message.author.id] ? (bank.money[message.author.id] + 10000) : 10000;
                        bank.code.in10000.splice(bank.code.in10000.indexOf(input[1]), 1);
                        message.channel.send("10,000Đ이 입금되었습니다.");
                    } else {
                        message.channel.send("사용 불가능한 입금 코드입니다.");
                    }
                    break;
                case "!get":
                    if (["100", "1000", "10000"].includes(input[1])) {
                        if (bank.money[message.author.id] && Number(input[1]) <= bank.money[message.author.id]) {
                            if (bank.code["out" + input[1]].length == 0) {
                                message.channel.send("모든 출금 코드가 만료되었습니다. 관리자에게 문의해주시기 바랍니다.");
                            } else {
                                bank.money[message.author.id] -= Number(input[1]);
                                message.author.send(`
${input[1].replace(/\B(?=(\d{3})+(?!\d))/g, ",")}Đ이 출금되었습니다.
출금 토큰은
${bank.code["out" + input[1]][0]}
입니다.
출금기가 초기화 될 때 해당 코드는 만료되어 돈의 소유권을 주장하지 못할 수 있으니 이 점 숙지하여 최대한 빠른 기간 안에 마인크래프트 내 은행에서 돈을 꺼내 가시기 바랍니다.
                                `);
                                bank.code["out" + input[1]].splice(0, 1);
                            }
                        } else {
                            message.channel.send("잔고가 부족합니다.");
                        }
                    } else {
                        message.channel.send("출금액은 100/1000/10000으로만 입력해주십시오.");
                    }
                    break;
                case "!give":
                    if (Number(input[2]) == NaN) {
                        message.channel.send("송금액은 수로 입력해주십시오.");
                    } else if (!(input[1].startsWith("<@") && input[1].endsWith(">"))) {
                        message.channel.send("송금할 유저는 태그로 입력하여주십시오.");
                    } else if (!bank.money[message.author.id] || bank.money[message.author.id] < Number[input[2]]) {
                        message.channel.send("잔고가 부족합니다.");
                    } else {
                        bank.money[message.author.id] -= Number(input[2]);
                        bank.money[input[1].replace(/@|!|>|</g, "")] = bank.money[input[1].replace(/@|!|>|</g, "")] ? bank.money[input[1].replace(/@|!|>|</g, "")] + Number(input[2]) : Number(input[2]);
                        message.channel.send(`
<@!${message.author.id}> <@!${input[1].replace(/@|!|>|</g, "")}>
${input[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",")}Đ이 송금되었습니다.
                        `);
                    }
                    break;
                case "!rank":
                    let rank = Object.entries(bank.money).sort((a, b) => a[1] < b[1] ? 1 : -1);
                    message.channel.send(`
🥇 <@!${rank[0][0]}> : ${rank[0][1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}Đ
🥈 <@!${rank[1][0]}> : ${rank[1][1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}Đ
🥉 <@!${rank[2][0]}> : ${rank[2][1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}Đ
당신의 순위 : ${rank.findIndex((a) => (a[0] == message.author.id)) + 1}위
                    `);
                    break;
                default:
                    message.channel.send("존재하지 않는 명령어입니다.")
            }
        }
        saveData();
    }
});

client.login(process.env.TOKEN);
