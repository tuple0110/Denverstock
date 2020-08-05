const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const cron = require("cron");
let point = require("./point.json");
let stock = require("./stock.json");
let manageChannel = "loading";

client.once('ready', () => {
    console.log("ON");
    manageChannel = client.channels.cache.get("731119566641430559");
    for (let i in stock) {
        let company = stock[i];
        new cron.CronJob(`0 0 */${company.allocationCycle} * *`, function () {
            let investors = "";
            for (let j in company.investor) {
                investors += `<@${j}> : ${company.investor[j]}장\n`;
            }
            channel.send(`
[배당 알람]
<:diamond:734360722452250674> 배당금을 받을 시간입니다. <:diamond:734360722452250674>
-주식 보유 현황-
${investors}
            `);
        }).start();
    }
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
                case "!reset":
                    (async () => {
                        let fetched;
                        do {
                            fetched = await manageChannel.messages.fetch({
                                limit: 100
                            });
                            manageChannel.bulkDelete(fetched);
                        }
                        while (fetched.size >= 2);
                    })();
                    point = {}
                    stock = {}
                    break;
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
                                        deny: ['SEND_MESSAGES'],
                                    },
                                    {
                                        id: message.author.id,
                                        allow: ['SEND_MESSAGES'],
                                    }
                                ]
                            }).then(channel => {
                                channel.setParent("734268233515008110");
                                let company = stock[input[1]];
                                let allocationAlarm = new cron.CronJob(`0 0 */${Number(input[4])} * *`, function () {
                                    let investors = ""
                                    for (let i in company.investor) {
                                        investors += `<@${i}> : ${company.investor[i]}장\n`
                                    }
                                    channel.send(`
[배당 알람]
<:diamond:734360722452250674> 배당금을 받을 시간입니다. <:diamond:734360722452250674>
-주식 보유 현황-
${investors}
                                    `);
                                });
                                allocationAlarm.start();
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
!assign [판매자 태그] [판매량] [판매가 합계]
                    `);
                    break;
                case "!assign":
                    if (input.length < 4) {
                        message.channel.send("입력값을 모두 입력해주십시오.");
                    } else if (stock[message.channel.name.toUpperCase()].investor[message.author.id] < Number(input[2])) {
                        message.channel.send(`
보유하고 있는 주식의 수가 부족합니다.
잔여 주식 : ${stock[message.channel.name.toUpperCase()].investor[message.author.id]}장
                        `);
                    } else if (!(input[1].startsWith("<@")) || !(input[1].endsWith(">"))) {
                        message.channel.send(`
판매자는 태그로 입력하여 주십시오.
예) !assign <@!731121207256023051> 1 100
                        `);
                    } else if (isNaN(input[2]) || isNaN(input[3])) {
                        message.channel.send("판매량과 판매가는 수로 입력해주십시오.");
                    } else {
                        if (stock[message.channel.name.toUpperCase()].investor[input[1].replace(/[^0-9]/g, "")]) {
                            stock[message.channel.name.toUpperCase()].investor[input[1].replace(/[^0-9]/g, "")] += Number(input[2]);
                        } else {
                            stock[message.channel.name.toUpperCase()].investor[input[1].replace(/[^0-9]/g, "")] = Number(input[2]);
                        }
                        stock[message.channel.name.toUpperCase()].investor[message.author.id] -= Number(input[2]);
                        stock[message.channel.name.toUpperCase()].dealCount += Number(input[2]);
                        stock[message.channel.name.toUpperCase()].dealPrice += Number(input[3]);
                        manageChannel.send(`
<@${message.author.id}> ${input[1]}
${message.channel.name.toUpperCase()} 사의 주식 ${input[2]}이 ${input[3]}원에 성공적으로 거래되었습니다.
                        `);
                    }
                    break;
                default:
                    message.channel.send("존재하지 않는 명령어입니다.");
            }
        }
    }
    fs.writeFileSync("./point.json", JSON.stringify(point));
    fs.writeFileSync("./stock.json", JSON.stringify(stock));
});

client.login(process.env.TOKEN);
