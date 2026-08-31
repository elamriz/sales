"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS=["#8b5cf6","#22c55e","#06b6d4","#f59e0b","#ec4899","#14b8a6","#6366f1","#f97316","#a3e635","#94a3b8"];

const euro=(v:number)=>new Intl.NumberFormat("fr-BE",{style:"currency",currency:"EUR"}).format(v);

export function PaymentShareChart({data}:{data:Array<{method:string;orders:number;revenue:number;share:number}>}){
  return <div className="grid gap-5 xl:grid-cols-2">
    <div className="h-[360px] rounded-2xl border border-white/7 bg-black/10 p-3">
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="revenue" nameKey="method" innerRadius={72} outerRadius={118} paddingAngle={2}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{background:"#11151e",border:"1px solid rgba(255,255,255,.08)",borderRadius:12}} formatter={(v)=>euro(Number(v))}/><Legend wrapperStyle={{fontSize:12}}/></PieChart></ResponsiveContainer>
    </div>
    <div className="h-[360px] rounded-2xl border border-white/7 bg-black/10 p-3">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{left:20,right:20}}><CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false}/><XAxis type="number" tick={{fill:"#777f91",fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="method" width={120} tick={{fill:"#aeb5c2",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#11151e",border:"1px solid rgba(255,255,255,.08)",borderRadius:12}}/><Bar dataKey="orders" name="Commandes" fill="#8b5cf6" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer>
    </div>
  </div>;
}

export function ProductVolumeChart({data}:{data:Array<{name:string;quantity:number}>}){
  return <div className="h-[360px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{left:25,right:20}}><CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false}/><XAxis type="number" tick={{fill:"#777f91",fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={130} tick={{fill:"#aeb5c2",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#11151e",border:"1px solid rgba(255,255,255,.08)",borderRadius:12}}/><Bar dataKey="quantity" name="Unités" fill="#22c55e" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>;
}
