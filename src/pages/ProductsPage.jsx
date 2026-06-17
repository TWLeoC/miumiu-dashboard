import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProductsPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">商品管理</h1>
      <Card>
        <CardHeader><CardTitle>商品列表</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
