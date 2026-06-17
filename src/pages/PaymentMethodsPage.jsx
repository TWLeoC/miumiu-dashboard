import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentMethodsPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">付款方式</h1>
      <Card>
        <CardHeader><CardTitle>付款設定</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
