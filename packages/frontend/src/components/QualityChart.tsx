import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QualityChartProps {
  data: Array<{ date: string; count: number; avgScore: number }>;
}

export default function QualityChart({ data }: QualityChartProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Quality Trend (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="avgScore" stroke="#8B5CF6" name="Avg Quality Score" />
          <Line type="monotone" dataKey="count" stroke="#3B82F6" name="Generations" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
