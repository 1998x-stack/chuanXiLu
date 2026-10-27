// Curated lenses for keyword navigation. Keyword hits ≠ scholarly semantic annotation.
// Evidence excerpts are independently asserted against the pinned original transcription.
export const TOPIC_GUIDE = [
  {id:"zhi-xing",label:"知行合一",keywords:["知行合一","知而不行","知是行之始"],summary:"从真知与行为的关系理解持续实践，而非催促未经思考的行动。",limit:"做不到不等于人格有缺陷；须考虑健康、资源与现实条件。",evidence:[{id:"CXL-0005",quote:"知而不行，只是未知"},{id:"CXL-0005",quote:"知是行之始，行是知之成"}]},
  {id:"xin-li",label:"心即理",keywords:["心即理","心外无理","心外之理"],summary:"讨论道德主体与天理的关系，重在反求诸己与澄清动机。",limit:"不能据此否定经验事实或自然规律。",evidence:[{id:"CXL-0003",quote:"心即理也"},{id:"CXL-0140",quote:"心即理也，学者，学此心也"}]},
  {id:"liang-zhi",label:"致良知",keywords:["致良知","良知","是非之心"],summary:"将是非觉察落实到真实处境里的判断、修正与担当。",limit:"个人直觉需要接受信息、他人权益及现实反馈的检验。",evidence:[{id:"CXL-0222",quote:"如今念念致良知"},{id:"CXL-0288",quote:"良知只是个是非之心"}]},
  {id:"ge-wu",label:"格物诚意",keywords:["格物","诚意","止至善"],summary:"把内在意念与具体事情连接，理解阳明对《大学》的解释。",limit:"不可将「心上用功」误读为放弃知识学习和外部调查。",evidence:[{id:"CXL-0006",quote:"格物是止至善之功"},{id:"CXL-0130",quote:"『诚意』之说，自是圣门教人用功第一义"}]},
  {id:"shi-shang",label:"事上磨炼",keywords:["事上磨","事上","临事"],summary:"修养须经受复杂工作与日常处境的检验，不限于静坐或空谈。",limit:"实践应有风险边界和必要休息，不是任何事都硬闯。",evidence:[{id:"CXL-0023",quote:"人须在事上磨，方立得住"},{id:"CXL-0204",quote:"人须在事上磨练做功夫，乃有益"}]},
  {id:"li-zhi",label:"立志养心",keywords:["立志","种德","志贵"],summary:"以长期志向、日常习惯和根本动机培植德行。",limit:"立志不等于以单一标准衡量每个人的价值。",evidence:[{id:"CXL-0016",quote:"只念念要存天理，即是立志"},{id:"CXL-0115",quote:"故立志贵专一"}]},
  {id:"qin-min",label:"亲民与仁",keywords:["亲民","仁民","亲亲"],summary:"借《大学》亲民、新民之辨，认识爱护与教化的不同侧重。",limit:"古代身份伦理不能直接套用为现代支配权力。",evidence:[{id:"CXL-0001",quote:"说『亲民』便是兼教养意"},{id:"CXL-0089",quote:"虽亲民亦明德事也"}]},
  {id:"jing-zuo",label:"静坐与动静",keywords:["静坐","动亦定","静亦定"],summary:"辨析养静、日常专注与现实事务之间的互补关系。",limit:"不是心理治疗指引，更不替代专业医疗照护。",evidence:[{id:"CXL-0017",quote:"日间工夫觉纷扰，则静坐"},{id:"CXL-0204",quote:"若只好静，遇事便乱"}]}
];
export function topicById(id){return TOPIC_GUIDE.find(topic=>topic.id===id)??null}
export function topicHits(entries,topic){
 if(!topic)return [];
 return entries.filter(entry=>topic.keywords.some(word=>entry.text.includes(word)));
}
