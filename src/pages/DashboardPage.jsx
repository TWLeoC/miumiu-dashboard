import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">報表總覽</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '今日訂單', value: '—' },
          { label: '今日營收', value: '—' },
          { label: '本月訂單', value: '—' },
          { label: '本月營收', value: '—' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>訂單趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">圖表開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
