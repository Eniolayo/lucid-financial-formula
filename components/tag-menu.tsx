"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TimePeriodSelector } from "@/components/time-period-selector"

interface TagMenuProps {
  tag: {
    id: string
    name: string
    value: number
    timePeriod?: string
  }
  onClose: () => void
  onRemove: () => void
  onUpdate: (updatedTag: { id: string; name: string; value: number; timePeriod?: string }) => void
}

export function TagMenu({ tag, onClose, onRemove, onUpdate }: TagMenuProps) {
  const [name, setName] = useState(tag.name)
  const [value, setValue] = useState(tag.value.toString())
  const [timePeriod, setTimePeriod] = useState(tag.timePeriod || "This month")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      id: tag.id,
      name,
      value: Number.parseFloat(value) || 0,
      timePeriod,
    })
  }

  return (
    <div className="absolute z-10 mt-1 w-64 bg-white border rounded-md shadow-lg">
      <div className="p-3">
        <h3 className="font-medium mb-2">Edit Variable</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Value
              </label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700">
                Time Period
              </label>
              <div className="mt-1">
                <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
              </div>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onRemove}>
                Remove
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

