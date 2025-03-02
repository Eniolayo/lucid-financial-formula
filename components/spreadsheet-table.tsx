"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import FormulaInput from "@/components/formula-input"
import { Button } from "@/components/ui/button"

export default function SpreadsheetTable() {
  const [showFormula, setShowFormula] = useState(false)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null)

  // Mock data for the table
  const rows = 10
  const cols = 5
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const toggleFormula = () => {
    setShowFormula(!showFormula)
  }

  const handleCellClick = (row: number, col: number) => {
    setActiveCell({ row, col })
    setShowFormula(true)
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex border-b">
        <div className="w-full max-w-3xl">
          <div className="flex items-center border-b">
            <div className="w-10 h-10 flex items-center justify-center border-r bg-gray-50">fx</div>
            {activeCell && (
              <Button variant="ghost" className="h-10 px-4 text-left justify-start font-mono" onClick={toggleFormula}>
                {`Cell ${String.fromCharCode(65 + activeCell.col)}${activeCell.row + 1}`}
              </Button>
            )}
          </div>

          {showFormula && (
            <div className="p-4 border-b bg-white shadow-md">
              <FormulaInput onClose={() => setShowFormula(false)} />
            </div>
          )}

          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-10 h-8 bg-gray-50 border"></th>
                  {Array.from({ length: cols }).map((_, i) => (
                    <th key={i} className="min-w-24 h-8 bg-gray-50 border font-normal text-sm">
                      {String.fromCharCode(65 + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="w-10 h-8 bg-gray-50 border text-center text-sm">{rowIndex + 1}</td>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={`min-w-24 h-8 border ${activeCell?.row === rowIndex && activeCell?.col === colIndex ? "bg-blue-50 outline outline-2 outline-blue-500" : ""}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        <div className="w-full h-full px-2 flex items-center">
                          {activeCell?.row === rowIndex && activeCell?.col === colIndex ? (
                            <Input className="border-0 h-7 p-0 focus-visible:ring-0" autoFocus />
                          ) : null}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-l overflow-auto">
          <div className="sticky top-0 h-8 bg-gray-50 border-b flex items-center px-3 font-medium">Monthly Results</div>
          <div className="flex">
            <div className="flex flex-col">
              {months.map((month, i) => (
                <div key={i} className="h-8 border-b px-3 flex items-center min-w-16">
                  {month}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              {months.map((_, i) => (
                <div key={i} className="h-8 border-b border-l px-3 flex items-center min-w-24 text-right">
                  {activeCell ? `$${Math.floor(Math.random() * 10000)}` : "-"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

