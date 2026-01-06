import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';
import { Patent, PatentStatus, PatentType } from '../types';

interface PatentStatsProps {
  patents: Patent[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

// Helper to calculate percentage
const toPercent = (decimal: number, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;

// Custom Label for Pie Chart to show Name + %
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  // Move label slightly inward (0.5 centers it in the donut ring)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PatentStats: React.FC<PatentStatsProps> = ({ patents }) => {
  const totalPatents = patents.length;

  // -----------------------------------------------------------
  // 1. Data Processing for Global Stats
  // -----------------------------------------------------------

  // Type Data
  const typeMap: Record<string, number> = {};
  patents.forEach(p => typeMap[p.type] = (typeMap[p.type] || 0) + 1);
  const typeData = Object.keys(typeMap).map(k => ({ 
    name: k, 
    value: typeMap[k] 
  }));

  // Country Data
  const countryMap: Record<string, number> = {};
  patents.forEach(p => {
    const code = p.country.split(' ')[0];
    countryMap[code] = (countryMap[code] || 0) + 1;
  });
  const countryData = Object.keys(countryMap).map(k => ({ 
    name: k, 
    count: countryMap[k],
    percent: countryMap[k] / totalPatents
  }));

  // -----------------------------------------------------------
  // 2. Data Processing for Patentee Stats
  // -----------------------------------------------------------
  
  const uniquePatentees = Array.from(new Set(patents.map(p => p.patentee))) as string[];
  
  // Patentee Summary Table Data
  const patenteeStats = uniquePatentees.map(patentee => {
    const pList = patents.filter(p => p.patentee === patentee);
    const total = pList.length;
    const active = pList.filter(p => p.status === PatentStatus.Active).length;
    const expired = pList.filter(p => p.status === PatentStatus.Expired).length;
    return { name: patentee, total, active, expired };
  }).sort((a, b) => b.total - a.total); // Sort by total desc

  // -----------------------------------------------------------
  // 3. Data Processing for Stacked Charts (Type x Patentee & Country x Patentee)
  // -----------------------------------------------------------

  const typeByPatenteeData = Object.keys(typeMap).map(type => {
    const item: Record<string, any> = { name: type };
    let typeTotal = 0;
    uniquePatentees.forEach(patentee => {
      const count = patents.filter(p => p.type === type && p.patentee === patentee).length;
      if (count > 0) {
        item[patentee] = count;
        typeTotal += count;
      }
    });
    item.total = typeTotal;
    return item;
  });

  const countryByPatenteeData = Object.keys(countryMap).map(country => {
    const item: Record<string, any> = { name: country };
    let countryTotal = 0;
    uniquePatentees.forEach(patentee => {
      const count = patents.filter(p => p.country.startsWith(country) && p.patentee === patentee).length;
      if (count > 0) {
        item[patentee] = count;
        countryTotal += count;
      }
    });
    item.total = countryTotal;
    return item;
  });

  // Custom Tooltip for Stacked Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs z-50 relative">
          <p className="font-bold mb-2 border-b pb-1">{label} (總計: {total})</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ color: entry.color }} className="flex justify-between gap-4 mb-1">
              <span>{entry.name}:</span>
              <span>{entry.value} ({toPercent(entry.value / total, 1)})</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      
      {/* ---------------- Section 1: Global Overview ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Simple Count Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center col-span-1 md:col-span-1 min-w-0">
            <h3 className="text-gray-500 text-sm font-medium mb-4">專利總覽</h3>
            <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-800">{totalPatents}</span>
                <span className="text-sm text-gray-500 mb-2">件</span>
            </div>
             <div className="flex justify-between w-full text-xs text-gray-500 border-t pt-4">
                <div className="flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                     存續: {patents.filter(p => p.status === PatentStatus.Active).length}
                </div>
                <div className="flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div>
                     屆期: {patents.filter(p => p.status === PatentStatus.Expired).length}
                </div>
            </div>
        </div>

        {/* Global Type Distribution (Pie) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-1 min-w-0">
            <h3 className="text-gray-700 text-sm font-medium mb-2">案件類型佔比</h3>
            <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                    <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                    {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{ zIndex: 100 }} />
                    <Legend 
                        iconSize={8} 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{fontSize: '10px', paddingBottom: '5px'}}
                        formatter={(value, entry: any) => `${value}：${entry.payload.value}件`}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Global Country Distribution (Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2 min-w-0">
             <h3 className="text-gray-700 text-sm font-medium mb-2">申請國家分佈</h3>
             <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={30} tick={{fontSize: 10}} />
                        <Bar dataKey="count" fill="#64748b" radius={[0, 4, 4, 0]} barSize={24}>
                             <LabelList 
                                dataKey="percent" 
                                position="inside" 
                                formatter={(val: number) => val > 0 ? `${(val * 100).toFixed(0)}%` : ''}
                                style={{ fill: '#fff', fontSize: '10px', fontWeight: 'bold', textShadow: '0px 0px 2px rgba(0,0,0,0.3)' }}
                             />
                             <LabelList 
                                dataKey="count" 
                                position="right" 
                                formatter={(val: number) => `${val}件`}
                                style={{ fill: '#64748b', fontSize: '11px', fontWeight: 'bold' }}
                             />
                             {
                                countryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))
                             }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* ---------------- Section 2: Patentee Analysis ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Patentee Summary Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[320px] min-w-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">各專利權人案件概況</h3>
            </div>
            <div className="overflow-auto custom-scrollbar flex-1">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3">專利權人</th>
                            <th className="px-4 py-3 text-right">總件數</th>
                            <th className="px-4 py-3 text-right text-green-600">存續中</th>
                            <th className="px-4 py-3 text-right text-red-500">已屆期</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {patenteeStats.map((stat, idx) => (
                            <tr key={stat.name} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    {stat.name}
                                </td>
                                <td className="px-4 py-3 text-right font-bold">{stat.total}</td>
                                <td className="px-4 py-3 text-right text-green-600">{stat.active}</td>
                                <td className="px-4 py-3 text-right text-red-400">{stat.expired}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Stacked Chart: Type by Patentee */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[320px] min-w-0">
            <h3 className="text-gray-700 font-bold mb-4">專利權人 x 案件類型分佈</h3>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={typeByPatenteeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 11}} />
                        <YAxis tick={{fontSize: 11}} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconSize={8} wrapperStyle={{fontSize: '10px'}} />
                        {uniquePatentees.map((patentee, index) => (
                             <Bar 
                                key={patentee} 
                                dataKey={patentee} 
                                stackId="a" 
                                fill={COLORS[index % COLORS.length]} 
                                barSize={40}
                             />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Stacked Chart: Country by Patentee */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[320px] md:col-span-2 min-w-0">
            <h3 className="text-gray-700 font-bold mb-4">專利權人 x 申請國家分佈</h3>
            <div className="h-[240px] w-full">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={countryByPatenteeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 11}} />
                        <YAxis tick={{fontSize: 11}} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconSize={8} wrapperStyle={{fontSize: '10px'}} />
                        {uniquePatentees.map((patentee, index) => (
                             <Bar 
                                key={patentee} 
                                dataKey={patentee} 
                                stackId="a" 
                                fill={COLORS[index % COLORS.length]} 
                                barSize={50}
                             />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PatentStats;