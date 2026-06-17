import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DiscountsPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">優惠券管理</h1>
      <Card>
        <CardHeader><CardTitle>優惠碼列表</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
