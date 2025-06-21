"use client"

import type { FC } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import type { RfpControlType } from "./formSchema"

export const ScopeSection: FC<{ control: RfpControlType }> = ({ control }) => {
  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Project Scope</h3>

      <p className="text-lg text-pine-shadow mb-8 leading-relaxed">
        Define your project's goals, deliverables, and objectives. Think of this as your project's roadmap — where
        you're going and how you'll get there.
      </p>

      <div className="space-y-8">
        <FormField
          control={control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="poster-label">Project Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a descriptive project title" className="poster-input" {...field} />
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="projectScope"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="poster-label">Project Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the project scope, objectives, and deliverables in Markdown format..."
                  className="poster-textarea min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-tomato-stamp text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

