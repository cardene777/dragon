# How to choose a pattern

This page is a hub for the 12 patterns that show up most often in general-purpose development.
When you want to express one of these patterns in cdl, find the pattern here first and follow the link to its guide.

Every pattern guide follows the same four-part structure: prerequisites, steps, verification, and design intent.
Each guide also contrasts the cdl version with its mermaid equivalent and ships a complete, ready-to-run code sample.

## Choose a pattern by use case

If you already know what you want to build, work backward from the table below.

| What you want to do | Recommended pattern |
|---|---|
| Connect two adjacent nodes with a single edge | Direct (in the Cookbook) |
| Pass through an intermediate node to express the end-to-end flow | Passthrough (in the Cookbook) |
| Show the read and write order inside a function | Call -> Read -> Write (in the Cookbook) |
| Notify the outside world that processing has completed | Emit Event (in the Cookbook) |
| Invoke a hook on the receive side and return a callback | Hook callback (in the Cookbook) |
| Express an if/else / switch branch | Branch (in the Cookbook) |
| Repeat the same processing multiple times | Loop (in the Cookbook) |
| Fan one input out to multiple workers | Fan-out (in the Cookbook) |
| Aggregate results from multiple workers | Fan-in (in the Cookbook) |
| Roll back to the original state on failure | Rollback (in the Cookbook) |
| Run something automatically at a fixed interval | Schedule (in the Cookbook) |
| Validate input before processing | Validate -> Process (in the Cookbook) |

## Pattern catalog

The 12 patterns currently shipped. The catalog page lets you scan their visuals at a glance.

| Pattern | What it expresses | Guide |
|---|---|---|
| Direct | Connect two adjacent nodes with a single edge | In the Cookbook |
| Passthrough | Pass through an intermediate node to express the end-to-end flow | In the Cookbook |
| Call -> Read -> Write | The read and write flow inside a function | In the Cookbook |
| Emit Event | Notify the outside world that processing has completed | In the Cookbook |
| Hook callback | Invoke a hook on the receive side and return a callback | In the Cookbook |
| Branch | A conditional path that splits in two | In the Cookbook |
| Loop | Repeat the same processing multiple times | In the Cookbook |
| Fan-out | Fan one input out to multiple workers | In the Cookbook |
| Fan-in | Aggregate results from multiple workers | In the Cookbook |
| Rollback | Roll back to the original state on failure | In the Cookbook |
| Schedule | Run something automatically at a fixed interval | In the Cookbook |
| Validate -> Process | Validate input before processing | In the Cookbook |

To see what all 12 patterns look like side by side, open the [catalog page](/catalog/patterns).

## Related docs

- The [Cookbook](/docs/en/cdl/overview/cookbook) walks you through 25 complete examples.
- The [Catalog page](/catalog/patterns) lets you scan the visuals of all 12 patterns.
