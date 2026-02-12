'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Crown } from 'lucide-react'
import type { AccountProfile, CommanderGoal } from '@/lib/engine/types'
import type { CommanderSkillSet } from '@/lib/kvk-engine'
import { calcCommanderNeeds } from '@/lib/engine/commanderEngine'

function createDefaultCommander(name?: string): CommanderGoal {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name || '',
    rarity: 'legendary',
    currentSkills: [5, 1, 1, 1],
    targetSkills: [5, 5, 1, 1],
    allocationPct: 100,
  }
}

export function CommandersSection({
  profile,
  onUpdate,
}: {
  profile: AccountProfile
  onUpdate: (p: AccountProfile) => void
}) {
  const skillLabels = ['1st Skill', '2nd Skill', '3rd Skill', '4th Skill']

  const addCommander = () => {
    const cmd = createDefaultCommander()
    const cmds = [...profile.commanders, cmd]
    const pctEach = Math.floor(100 / cmds.length)
    const balanced = cmds.map((c, i) => ({
      ...c,
      allocationPct: i === cmds.length - 1 ? 100 - pctEach * (cmds.length - 1) : pctEach,
    }))
    onUpdate({ ...profile, commanders: balanced })
  }

  const removeCommander = (id: string) => {
    const cmds = profile.commanders.filter((c) => c.id !== id)
    if (cmds.length > 0) {
      const pctEach = Math.floor(100 / cmds.length)
      const balanced = cmds.map((c, i) => ({
        ...c,
        allocationPct: i === cmds.length - 1 ? 100 - pctEach * (cmds.length - 1) : pctEach,
      }))
      onUpdate({ ...profile, commanders: balanced })
    } else {
      onUpdate({ ...profile, commanders: [] })
    }
  }

  const updateCommander = (id: string, patch: Partial<CommanderGoal>) => {
    onUpdate({
      ...profile,
      commanders: profile.commanders.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  const updateSkill = (id: string, type: 'current' | 'target', index: number, value: number) => {
    const cmd = profile.commanders.find((c) => c.id === id)
    if (!cmd) return
    const arr = type === 'current' ? [...cmd.currentSkills] : [...cmd.targetSkills]
    arr[index] = Math.max(1, Math.min(5, value))
    updateCommander(
      id,
      type === 'current'
        ? { currentSkills: arr as CommanderSkillSet }
        : { targetSkills: arr as CommanderSkillSet },
    )
  }

  const updateAllocation = (id: string, value: number) => {
    const others = profile.commanders.filter((c) => c.id !== id)
    const remaining = 100 - value
    const otherTotal = others.reduce((s, c) => s + c.allocationPct, 0) || 1
    const updated = profile.commanders.map((c) => {
      if (c.id === id) return { ...c, allocationPct: value }
      const ratio = c.allocationPct / otherTotal
      return { ...c, allocationPct: Math.max(0, Math.round(remaining * ratio)) }
    })
    const total = updated.reduce((s, c) => s + c.allocationPct, 0)
    if (total !== 100 && updated.length > 1) {
      const last = updated.find((c) => c.id !== id)
      if (last) last.allocationPct += 100 - total
    }
    onUpdate({ ...profile, commanders: updated })
  }

  return (
    <div className="space-y-6">
      {profile.commanders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Crown className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No commanders added yet. Add a commander to start planning gold head investments.
            </p>
            <Button onClick={addCommander} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Commander
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {profile.commanders.map((cmd) => {
            const calc = calcCommanderNeeds(cmd)
            const pct = calc.total > 0 ? Math.round((calc.invested / calc.total) * 100) : 0

            return (
              <Card key={cmd.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Crown className="h-4 w-4 text-primary" />
                      {cmd.name || 'Unnamed Commander'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCommander(cmd.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Commander Name</Label>
                      <Input
                        value={cmd.name}
                        onChange={(e) => updateCommander(cmd.id, { name: e.target.value })}
                        placeholder="e.g. YSG, Alex, Guan Yu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Rarity</Label>
                      <Select
                        value={cmd.rarity}
                        onValueChange={(v) => updateCommander(cmd.id, { rarity: v as 'legendary' | 'epic' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="legendary">Legendary</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Skill levels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Current Skills</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {skillLabels.map((label, i) => (
                          <div key={`cur-${cmd.id}-${label}`} className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">{label}</Label>
                            <Select
                              value={String(cmd.currentSkills[i])}
                              onValueChange={(v) => updateSkill(cmd.id, 'current', i, Number(v))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{cmd.currentSkills.join('-')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Target Skills</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {skillLabels.map((label, i) => (
                          <div key={`tgt-${cmd.id}-${label}`} className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">{label}</Label>
                            <Select
                              value={String(cmd.targetSkills[i])}
                              onValueChange={(v) => updateSkill(cmd.id, 'target', i, Number(v))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{cmd.targetSkills.join('-')}</p>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Invested</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{calc.invested}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Needed</p>
                        <p className="text-sm font-bold text-primary tabular-nums">{calc.needed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{calc.total}</p>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-[10px] text-muted-foreground text-center mt-1">{pct}% complete</p>
                  </div>

                  {/* Allocation */}
                  {profile.commanders.length > 1 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Gold Head Allocation</Label>
                        <span className="text-xs font-semibold text-primary tabular-nums">{cmd.allocationPct}%</span>
                      </div>
                      <Slider
                        value={[cmd.allocationPct]}
                        onValueChange={([v]) => updateAllocation(cmd.id, v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          <Button onClick={addCommander} variant="outline" className="gap-2 w-full bg-transparent">
            <Plus className="h-4 w-4" />
            Add Another Commander
          </Button>
        </>
      )}
    </div>
  )
}
