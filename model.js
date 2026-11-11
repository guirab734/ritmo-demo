export const clone = value => JSON.parse(JSON.stringify(value));
export const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
export function effectiveExercises(day,catalog,stage='full') {
  return day.exercises.map((ref,index)=>{
    const item=catalog[ref.id];
    if(!item) return null;
    const cap=stage==='return1'?(index<3?2:1):stage==='return2'?2:8;
    return {...clone(item),...clone(ref),name:ref.name||item.name,muscle:item.muscle,cue:item.cue,art:item.art,sets:Math.min(ref.sets,cap),note:ref.note||''};
  }).filter(Boolean);
}
export function queueFor(session) {
  return session.exercises.flatMap((ex,exIndex)=>Array.from({length:ex.sets},(_,setIndex)=>({exIndex,setIndex})));
}
export function currentSet(session) {
  const q=queueFor(session),step=q[session.position];
  return step?{...step,exercise:session.exercises[step.exIndex],total:q.length}:null;
}
export function newSession(day,exercises,versionName,stage,now=Date.now()) {
  return {id:'session-'+now,dayId:day.id,dayLabel:day.label,title:day.title,versionName,stage,exercises:clone(exercises),startedAt:now,workStartedAt:now,position:0,logs:[],phase:'work',restDeadline:null,restStartedAt:null,pausedAt:null,pausedTotal:0,finishedAt:null,partial:false};
}
export function elapsedMs(session,now=Date.now()) {
  return Math.max(0,(session.finishedAt??session.pausedAt??now)-session.startedAt-session.pausedTotal);
}
export function restRemainingSec(session,now=Date.now()) {
  if(session.phase!=='rest'||!session.restDeadline)return 0;
  return Math.max(0,Math.ceil((session.restDeadline-(session.pausedAt??now))/1000));
}
export function completeSet(session,values={},now=Date.now()) {
  if(session.phase!=='work'||session.pausedAt!==null)return session;
  const s=clone(session),step=currentSet(s);
  if(!step)return s;
  s.logs.push({exIndex:step.exIndex,setIndex:step.setIndex,exerciseId:step.exercise.id,name:step.exercise.name,reps:String(values.reps??''),weight:String(values.weight??''),completedAt:now,workMs:Math.max(0,now-s.workStartedAt)});
  s.position+=1;
  if(s.position>=step.total){s.phase='complete';s.finishedAt=now;return s;}
  s.phase='rest';s.restStartedAt=now;s.restDeadline=now+step.exercise.restSec*1000;
  return s;
}
export function endRest(session,now=Date.now()) {
  if(session.phase!=='rest'||session.pausedAt!==null)return session;
  return {...clone(session),phase:'work',restDeadline:null,restStartedAt:null,workStartedAt:now};
}
export function tickSession(session,now=Date.now()) {
  if(session.phase==='rest'&&session.pausedAt===null&&now>=session.restDeadline)return {session:endRest(session,now),ready:true};
  return {session,ready:false};
}
export function togglePause(session,now=Date.now()) {
  const s=clone(session);
  if(s.phase==='complete')return s;
  if(s.pausedAt===null){s.pausedAt=now;return s;}
  const delta=Math.max(0,now-s.pausedAt);
  s.pausedTotal+=delta;s.workStartedAt+=delta;
  if(s.restDeadline!==null)s.restDeadline+=delta;
  if(s.restStartedAt!==null)s.restStartedAt+=delta;
  s.pausedAt=null;return s;
}
export function undoSet(session,now=Date.now()) {
  if(!session.logs.length)return session;
  const s=clone(session);s.logs.pop();s.position-=1;s.phase='work';s.restDeadline=null;s.restStartedAt=null;s.workStartedAt=now;s.finishedAt=null;s.partial=false;
  if(s.pausedAt!==null){s.pausedTotal+=now-s.pausedAt;s.pausedAt=null;}
  return s;
}
export function finishSession(session,now=Date.now()) {
  const s=clone(session);
  if(s.pausedAt!==null){s.pausedTotal+=now-s.pausedAt;s.pausedAt=null;}
  s.partial=s.position<queueFor(s).length;s.phase='complete';s.finishedAt=now;
  return s;
}
export function initialDurationSec(exercises) {
  if(!exercises.length)return 0;
  const work=exercises.reduce((sum,ex)=>sum+ex.sets*60,0);
  const rest=exercises.reduce((sum,ex)=>sum+ex.sets*ex.restSec,0)-exercises.at(-1).restSec;
  return work+rest+Math.max(0,exercises.length-1)*30;
}
export function estimateRemainingSec(session,now=Date.now()) {
  if(session.phase==='complete')return 0;
  const steps=queueFor(session).slice(session.position);
  const samples=session.logs.map(x=>clamp(x.workMs/1000,25,180));
  const observed=samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:60;
  const perSet=samples.length>=2?observed*.65+60*.35:60;
  let seconds=0;
  steps.forEach((step,index)=>{
    seconds+=perSet;
    if(index<steps.length-1)seconds+=session.exercises[step.exIndex].restSec;
    if(index<steps.length-1&&step.exIndex!==steps[index+1].exIndex)seconds+=30;
  });
  if(session.phase==='rest')seconds+=restRemainingSec(session,now);
  else seconds-=Math.min(perSet*.75,Math.max(0,((session.pausedAt??now)-session.workStartedAt)/1000));
  return Math.max(0,Math.ceil(seconds));
}
export function averageDuration(history,dayId) {
  const items=history.filter(x=>x.dayId===dayId&&!x.partial&&x.durationMs>0).slice(0,6);
  return items.length?items.reduce((n,x)=>n+x.durationMs,0)/items.length:null;
}
export function historyRecord(session) {
  return {...clone(session),durationMs:elapsedMs(session,session.finishedAt),totalSets:queueFor(session).length,completedSets:session.logs.length};
}
export function isValidBackup(data) {
  if(!data||data.schema!==1||!Array.isArray(data.versions)||!data.versions.length||data.versions.length>50||!Array.isArray(data.history)||data.history.length>500)return false;
  const ids=['mon','tue','wed','thu','fri'];
  return data.versions.every(v=>typeof v.id==='string'&&typeof v.name==='string'&&v.name.length<100&&Array.isArray(v.days)&&v.days.length===5&&v.days.every((d,i)=>d.id===ids[i]&&Array.isArray(d.exercises)&&d.exercises.length>0&&d.exercises.length<=20&&d.exercises.every(e=>typeof e.id==='string'&&Number.isInteger(e.sets)&&e.sets>=1&&e.sets<=8&&typeof e.reps==='string'&&e.reps.length<=40&&Number.isFinite(e.restSec)&&e.restSec>=0&&e.restSec<=600)));
}
