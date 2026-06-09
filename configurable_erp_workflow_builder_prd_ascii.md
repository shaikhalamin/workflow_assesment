# PRD: Configurable ERP Workflow Builder & Runtime Module

## 1. Product Overview

### Product Name

**Configurable ERP Workflow Builder & Runtime Module**

### Context

FGL has business teams that often need software to reduce manual coordination between Sales, Accounts, Operations, HR, Finance, and Management.

The goal is to build a small but thoughtful ERP-style workflow system where different business modules can trigger approval workflows. The workflow must not be hardcoded. Instead, an admin should be able to configure workflow behavior from a **Workflow Builder Page**.

### Core Product Statement

The application provides a configurable workflow builder where admins can define workflows for module events such as:

```txt
expense.submitted
leave.requested
attendance.adjustment.requested
purchase.requested
salary.change.requested
invoice.approval.requested
```

At runtime, business modules trigger these events, the workflow engine evaluates configured conditions, creates approval steps dynamically, and tracks approval, rejection, audit history, and final business outcomes.

### Key Design Principle

```txt
Workflow is configured by admin,
triggered by module events,
evaluated by conditions,
and executed dynamically at runtime.
```

---

## 2. Assessment Goal

This project should demonstrate:

- Configurable ERP/business workflow thinking.
- Workflow Builder first, not hardcoded approval chains.
- At least two business modules that trigger workflow.
- Dynamic approval rules based on conditions.
- Multiple reviewer/approver steps.
- Role-based and user-based reviewer assignment.
- Approval and rejection with reason.
- Audit trail and status tracking.
- Final business outcome after approval.
- Architecture that can support future modules such as Attendance, Procurement, Payroll, Purchase, or Invoice Approval.

---

## 3. Core Modules

### 3.1 Workflow Builder Module

This is the main product surface.

Responsibilities:

```txt
Create workflow templates
Select module and module event
Load event field schema
Configure trigger conditions
Configure approval rules
Configure approval steps
Configure reviewer/approver assignment
Configure approved and rejected outcomes
Publish/deactivate workflows
```

### 3.2 Workflow Runtime Module

Responsibilities:

```txt
Receive module event payload
Find published workflow by module and event
Evaluate trigger conditions
Evaluate approval rules
Create workflow instance
Create dynamic workflow steps
Activate current approval step
Handle approve/reject actions
Track workflow history
Execute approved/rejected outcome
```

### 3.3 Expense Module

Responsibilities:

```txt
Create expense request
Submit expense request
Trigger expense.submitted event
Show expense status
Show linked workflow history
Create payment request after approval
```

### 3.4 Leave Module

Responsibilities:

```txt
Create leave request
Submit leave request
Trigger leave.requested event
Show leave status
Show linked workflow history
Finalize leave after approval
```

### 3.5 Payment Module

Responsibilities:

```txt
Create payment request after approved expense
Show pending payment requests
Mark payment request as paid
Update expense status to paid
```

### 3.6 Dashboard and Audit Module

Responsibilities:

```txt
Role-based dashboard
Pending approval list
Workflow instance detail
Approval timeline
Audit history
Notification summary
```

### 3.7 Future Module: Attendance

The system should support Attendance later without changing the workflow engine.

Example event:

```txt
attendance.adjustment.requested
```

---

## 4. Target Users

| User Type | Description |
|---|---|
| Admin | Creates and publishes workflow definitions |
| Employee | Creates Expense and Leave requests |
| Reviewer | Reviews assigned workflow steps |
| Manager | Approves business requests |
| HR Officer | Reviews Leave and Attendance workflows |
| Accounts Officer | Reviews expense/payment workflows |
| Finance Admin | Handles finance approval or payment |
| CFO / Management | Handles high-value approvals |

---

## 5. High-Level Workflow Concept

### 5.1 Before: Hardcoded Workflow

Do not use this as the final design:

```txt
Employee
   |
   v
Department Reviewer
   |
   v
Manager
   |
   v
Accounts Officer
   |
   v
Finance Admin
   |
   v
Payment Completed
```

Problem:

```txt
The approval chain is fixed.
It cannot support different modules.
It cannot support different approval paths by amount, duration, quantity, salary range, or custom fields.
```

### 5.2 After: Configurable Workflow

Use this design instead:

```txt
+-----------------------+
| Business Module Event |
| expense.submitted     |
| leave.requested       |
| attendance.requested  |
+-----------+-----------+
            |
            v
+-----------------------+
| Workflow Runtime      |
| Find workflow config  |
+-----------+-----------+
            |
            v
+-----------------------+
| Rule Engine           |
| Evaluate conditions   |
+-----------+-----------+
            |
            v
+-----------------------+
| Dynamic Step Creation |
| 2 / 3 / 4 / 5 steps   |
+-----------+-----------+
            |
            v
+-----------------------+
| Approval Execution    |
| Approve / Reject      |
+-----------+-----------+
            |
            v
+-----------------------+
| Final Business Outcome|
| Payment / Leave / etc |
+-----------------------+
```

---

## 6. Workflow Builder Page

### 6.1 Purpose

The Workflow Builder allows an admin to configure workflows without code.

The admin should be able to set:

```txt
Module
Module event type
Trigger conditions
Approval rules
Approval steps
Reviewer/approver assignment
Approved outcome
Rejected outcome
```

### 6.2 Builder Page Flow

```txt
+--------------------------------------------------+
|              Workflow Builder Page               |
+--------------------------------------------------+
        |
        v
+-----------------------------+
| Step 1: Basic Information   |
+-----------------------------+
        |
        v
+-----------------------------+
| Step 2: Module and Event    |
+-----------------------------+
        |
        v
+-----------------------------+
| Step 3: Trigger Conditions  |
+-----------------------------+
        |
        v
+-----------------------------+
| Step 4: Approval Rules      |
+-----------------------------+
        |
        v
+-----------------------------+
| Step 5: Approval Steps      |
+-----------------------------+
        |
        v
+-----------------------------+
| Step 6: Final Outcome       |
+-----------------------------+
        |
        v
+-----------------------------+
| Step 7: Review and Publish  |
+-----------------------------+
```

---

## 7. Workflow Builder Step 1: Basic Information

### Fields

| Field | Type | Required | Example |
|---|---|---:|---|
| Workflow Name | Text | Yes | Expense Approval Workflow |
| Description | Textarea | No | Approval process for expense requests |
| Status | Select | Yes | Draft |
| Priority | Number | Yes | 1 |
| Effective From | Date | No | 2026-06-01 |
| Effective To | Date | No | Empty |
| Allow Resubmission | Boolean | Yes | Yes |

### UI Sketch

```txt
--------------------------------------------------
Create Workflow
--------------------------------------------------

Workflow Name *
[ Expense Approval Workflow ]

Description
[ Approval process for employee expense requests ]

Status
[ Draft ▼ ]

Priority
[ 1 ]

Effective From
[ 2026-06-01 ]

Effective To
[ Optional ]

Allow Resubmission After Rejection?
[ Yes ]

[ Next: Select Module & Event ]
--------------------------------------------------
```

---

## 8. Workflow Builder Step 2: Select Module and Event

### Purpose

Select which business module and event can trigger the workflow.

### Fields

| Field | Type | Required | Example |
|---|---|---:|---|
| Module | Select | Yes | Expense |
| Module Event | Select | Yes | expense.submitted |
| Entity Type | Auto-filled | Yes | Expense |
| Event Description | Read-only | No | Triggered when expense is submitted |

### Supported Modules

Minimum:

```txt
Expense
Leave
```

Future:

```txt
Attendance
Purchase
Invoice
Payroll
Procurement
HR
```

### Event Examples

#### Expense Events

```txt
expense.submitted
expense.resubmitted
```

#### Leave Events

```txt
leave.requested
leave.resubmitted
```

#### Attendance Events

```txt
attendance.adjustment.requested
attendance.overtime.requested
attendance.remote.work.requested
```

#### Purchase Events

```txt
purchase.requested
purchase.order.submitted
```

#### Payroll Events

```txt
salary.change.requested
bonus.requested
advance.salary.requested
```

### UI Sketch

```txt
--------------------------------------------------
Step 2: Select Module & Event
--------------------------------------------------

Module *
[ Expense ▼ ]

Module Event *
[ expense.submitted ▼ ]

Entity Type
[ Expense ]

Event Description:
This event is triggered when an employee submits an expense request.

[ Back ] [ Next: Trigger Conditions ]
--------------------------------------------------
```

---

## 9. Workflow Builder Step 3: Trigger Conditions

### Purpose

Trigger conditions decide whether this workflow should start at all.

This is different from approval rules.

```txt
Trigger condition:
Should this workflow run?

Approval rule:
If this workflow runs, which approval path should be used?
```

### Example Use Cases

```txt
Expense workflow for Sales department only
Expense workflow for Operations department only
Leave workflow for permanent employees only
Attendance workflow only when payroll is impacted
Purchase workflow only for hardware items
Payroll workflow only for salary range above a threshold
```

### Condition Mode

```txt
Run Always
Run When Conditions Match
```

### Supported Field Types

```txt
text
number
select
boolean
date
user
currency
custom field
```

### Supported Operators

```txt
equals
not equals
greater than
greater than or equal
less than
less than or equal
between
in list
not in list
contains
is empty
is not empty
```

### Condition Field Examples

For Expense:

```txt
amount
currency
category
departmentId
itemValue
price
quantity
vendor
customFields.projectCode
customFields.costCenter
customFields.budgetOwnerId
```

For Leave:

```txt
leaveDays
leaveType
duration
employeeGrade
departmentId
customFields.region
customFields.emergencyLeave
```

For Attendance:

```txt
adjustmentType
durationMinutes
impactsPayroll
shiftType
departmentId
customFields.overtimeHours
```

For Purchase:

```txt
itemValue
price
quantity
totalValue
vendor
itemCategory
customFields.assetType
```

For Payroll:

```txt
salaryRange
incrementAmount
employeeGrade
departmentId
customFields.performanceRating
```

### UI Sketch

```txt
--------------------------------------------------
Step 3: Trigger Conditions
--------------------------------------------------

Should this workflow run always?

( ) Run Always
(*) Run When Conditions Match

Condition Group:
[ ALL ▼ ] of the following conditions are true:

1.
Field:
[ departmentId ▼ ]

Operator:
[ equals ▼ ]

Value:
[ Sales ▼ ]

[ + Add Condition ]

Condition Preview:
departmentId equals Sales

[ Back ] [ Next: Approval Rules ]
--------------------------------------------------
```

---

## 10. Workflow Builder Step 4: Approval Rules

### Purpose

Approval rules define which approval path should be used based on event payload values.

A single workflow can have multiple approval rules.

### Expense Approval Rule Example

| Rule | Condition | Required Steps |
|---|---|---:|
| Small Expense | amount < 2,000 | 2 |
| Medium Expense | amount >= 2,000 and amount < 5,000 | 3 |
| Large Expense | amount >= 5,000 and amount < 10,000 | 4 |
| High Value Expense | amount >= 10,000 | 5 |

### Leave Approval Rule Example

| Rule | Condition | Required Steps |
|---|---|---:|
| Short Leave | leaveDays <= 2 | 2 |
| Medium Leave | leaveDays > 2 and leaveDays <= 7 | 3 |
| Long Leave | leaveDays > 7 and leaveDays <= 15 | 4 |
| Extended Leave | leaveDays > 15 | 5 |

### Purchase Approval Rule Example

| Rule | Condition | Required Steps |
|---|---|---:|
| Small Purchase | totalValue < 5,000 | 2 |
| Medium Purchase | totalValue >= 5,000 and totalValue < 20,000 | 3 |
| Large Purchase | totalValue >= 20,000 | 5 |

### Salary Change Approval Rule Example

| Rule | Condition | Required Steps |
|---|---|---:|
| Small Increment | incrementAmount < 5,000 | 2 |
| Medium Increment | incrementAmount >= 5,000 and incrementAmount < 15,000 | 3 |
| High Increment | incrementAmount >= 15,000 | 5 |

### Approval Rule Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Rule Name | Text | Yes | Large Expense Rule |
| Priority | Number | Yes | Lower priority number evaluated first |
| Condition | Condition Builder | Yes unless fallback | Uses event field schema |
| Is Fallback Rule | Boolean | No | Used when no rule matches |
| Active | Boolean | Yes | Allows disabling a rule |

### UI Sketch

```txt
--------------------------------------------------
Step 4: Approval Rules
--------------------------------------------------

Approval Rules

Rule 1
--------------------------------------------------
Rule Name *
[ Small Expense Rule ]

Priority
[ 1 ]

When:
[ amount ] [ less than ] [ 2000 ]

Then:
Use approval path:
Department Reviewer -> Accounts Officer

[ Configure Steps ]

--------------------------------------------------

Rule 2
--------------------------------------------------
Rule Name *
[ Medium Expense Rule ]

Priority
[ 2 ]

When:
[ amount ] [ between ] [ 2000 - 5000 ]

Then:
Use approval path:
Department Reviewer -> Requester Manager -> Accounts Officer

[ Configure Steps ]

--------------------------------------------------

[ + Add Approval Rule ]

Fallback Rule
[ Use default approval path if no rule matches ]

[ Back ] [ Next: Approval Steps ]
--------------------------------------------------
```

---

## 11. Workflow Builder Step 5: Approval Steps

### Purpose

Each approval rule has its own approval steps.

This allows the same workflow to generate different approver chains depending on amount, duration, quantity, price, salary range, or custom field values.

### Approval Step Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Step Name | Text | Yes | Department Review |
| Step Order | Number | Yes | Sequential order |
| Step Type | Select | Yes | Review, Approval, Finance Check, HR Check |
| Assignee Type | Select | Yes | Role, User, Requester Manager, Department Head, Custom Field User |
| Assignee Role | Select | Conditional | Required if assignee type is Role |
| Assignee User | Select | Conditional | Required if assignee type is User |
| Assignee Field Path | Text/Select | Conditional | Required if Custom Field User |
| Required | Boolean | Yes | Whether this step is mandatory |
| Requires Comment | Boolean | No | Approver must add comment |
| Requires Attachment | Boolean | No | Approver must attach supporting file |
| Can Reject | Boolean | Yes | Whether approver can reject |
| Can Reassign | Boolean | No | Optional |
| SLA Hours | Number | No | Optional due time |
| Escalation Assignee | Select | No | Optional |

### Step Types

```txt
Review
Approval
Finance Check
HR Check
Management Approval
Final Verification
```

### Assignee Types

```txt
ROLE
USER
REQUESTER_MANAGER
DEPARTMENT_HEAD
CUSTOM_FIELD_USER
```

### Assignee Type Details

#### ROLE

Assign to a user who has a specific role.

Example:

```txt
Department Reviewer
Manager
Accounts Officer
HR Officer
Finance Admin
CFO
```

#### USER

Assign to a specific person.

Example:

```txt
John Reviewer
Maria Manager
Abdul Accounts
Fatima Finance Admin
```

#### REQUESTER_MANAGER

Resolve from the requester profile.

```txt
requester.managerId
```

#### DEPARTMENT_HEAD

Resolve from department setup.

```txt
department.headUserId
```

#### CUSTOM_FIELD_USER

Resolve from a user field in the submitted request payload.

Example:

```txt
customFields.budgetOwnerId
customFields.projectOwnerId
customFields.reportingManagerId
```

### UI Sketch

```txt
--------------------------------------------------
Configure Steps for: Large Expense Rule
Condition: amount >= 5000 and amount < 10000
--------------------------------------------------

Step 1
Step Name *
[ Department Review ]

Step Type
[ Review ▼ ]

Assignee Type *
[ Role Based ▼ ]

Role *
[ Department Reviewer ▼ ]

Required?
[ Yes ]

Requires Comment?
[ No ]

Requires Attachment?
[ No ]

Can Reject?
[ Yes ]

SLA
[ 24 ] hours

--------------------------------------------------

Step 2
Step Name *
[ Manager Approval ]

Step Type
[ Approval ▼ ]

Assignee Type *
[ Requester Manager ▼ ]

Required?
[ Yes ]

Requires Comment?
[ Optional ]

Can Reject?
[ Yes ]

SLA
[ 24 ] hours

--------------------------------------------------

Step 3
Step Name *
[ Finance Verification ]

Step Type
[ Finance Check ▼ ]

Assignee Type *
[ Role Based ▼ ]

Role *
[ Finance Admin ▼ ]

Required?
[ Yes ]

Requires Comment?
[ Yes ]

Can Reject?
[ Yes ]

SLA
[ 48 ] hours

--------------------------------------------------

Step 4
Step Name *
[ Accounts Review ]

Step Type
[ Final Verification ▼ ]

Assignee Type *
[ Role Based ▼ ]

Role *
[ Accounts Officer ▼ ]

Required?
[ Yes ]

Requires Comment?
[ Yes ]

Can Reject?
[ Yes ]

SLA
[ 48 ] hours

[ + Add Step ]

[ Back ] [ Save Rule Steps ]
--------------------------------------------------
```

---

## 12. Workflow Builder Step 6: Final Outcome

### Purpose

Define what should happen after the workflow is approved or rejected.

### Approved Outcome Examples

For Expense:

```txt
Set expense status to APPROVED
Create payment request
Notify requester
Notify accounts team
```

For Leave:

```txt
Set leave status to APPROVED
Deduct leave balance
Create leave calendar record
Notify requester
Notify HR
```

For Attendance:

```txt
Set attendance adjustment status to APPROVED
Update attendance record
Notify requester
Notify HR
```

### Rejected Outcome Examples

For Expense:

```txt
Set expense status to REJECTED
Require rejection reason
Allow requester to revise and resubmit
Notify requester
```

For Leave:

```txt
Set leave status to REJECTED
Require rejection reason
Notify requester
```

For Attendance:

```txt
Set attendance adjustment status to REJECTED
Require rejection reason
Notify requester
```

### UI Sketch

```txt
--------------------------------------------------
Step 6: Final Outcome
--------------------------------------------------

When Workflow is Approved:

[✓] Update source entity status
Status:
[ APPROVED ▼ ]

[✓] Create follow-up object
Object:
[ Payment Request ▼ ]

[✓] Notify requester

[✓] Notify role
Role:
[ Accounts Officer ▼ ]

--------------------------------------------------

When Workflow is Rejected:

[✓] Update source entity status
Status:
[ REJECTED ▼ ]

[✓] Require rejection reason

[✓] Allow resubmission

[✓] Notify requester

[ Back ] [ Next: Review & Publish ]
--------------------------------------------------
```

---

## 13. Workflow Builder Step 7: Review and Publish

### Purpose

Before publishing, show a readable preview of the configured workflow.

### Preview Example

```txt
--------------------------------------------------
Review Workflow
--------------------------------------------------

Workflow Name:
Expense Approval Workflow

Trigger:
Module: Expense
Event: expense.submitted

Trigger Condition:
departmentId equals Sales

Approval Rules:

1. Small Expense Rule
Condition:
amount < 2000

Steps:
1. Department Reviewer
2. Accounts Officer

2. Medium Expense Rule
Condition:
amount >= 2000 AND amount < 5000

Steps:
1. Department Reviewer
2. Requester Manager
3. Accounts Officer

3. Large Expense Rule
Condition:
amount >= 5000 AND amount < 10000

Steps:
1. Department Reviewer
2. Requester Manager
3. Finance Admin
4. Accounts Officer

4. High Value Expense Rule
Condition:
amount >= 10000

Steps:
1. Department Reviewer
2. Requester Manager
3. Finance Admin
4. CFO
5. Accounts Officer

Approved Outcome:
- Set Expense status to APPROVED
- Create Payment Request
- Notify requester
- Notify Accounts Officer

Rejected Outcome:
- Set Expense status to REJECTED
- Require rejection reason
- Allow resubmission
- Notify requester

[ Save as Draft ] [ Publish Workflow ]
--------------------------------------------------
```

---

## 14. Event Field Schema

### Purpose

When admin selects a module event, the builder should load available fields for conditions, assignee resolution, and outcomes.

Example:

```txt
Module = Expense
Event = expense.submitted
```

Available fields:

```txt
amount
currency
category
departmentId
vendor
itemValue
price
quantity
customFields.projectCode
customFields.costCenter
customFields.budgetOwnerId
```

### Field Schema Example: Expense

```json
{
  "module": "expense",
  "event": "expense.submitted",
  "entityType": "Expense",
  "fields": [
    {
      "key": "amount",
      "label": "Amount",
      "type": "number",
      "operators": ["gt", "gte", "lt", "lte", "between"]
    },
    {
      "key": "currency",
      "label": "Currency",
      "type": "select",
      "operators": ["eq", "neq", "in"],
      "options": ["USD", "BDT", "EUR"]
    },
    {
      "key": "category",
      "label": "Category",
      "type": "select",
      "operators": ["eq", "neq", "in"],
      "options": ["Travel", "Meal", "Office Supplies", "Software"]
    },
    {
      "key": "departmentId",
      "label": "Department",
      "type": "select",
      "operators": ["eq", "neq", "in"]
    },
    {
      "key": "customFields.projectCode",
      "label": "Project Code",
      "type": "text",
      "operators": ["eq", "neq", "contains"]
    },
    {
      "key": "customFields.budgetOwnerId",
      "label": "Budget Owner",
      "type": "user",
      "operators": ["eq", "neq"]
    }
  ]
}
```

### Field Schema Example: Leave

```json
{
  "module": "leave",
  "event": "leave.requested",
  "entityType": "LeaveRequest",
  "fields": [
    {
      "key": "leaveDays",
      "label": "Leave Days",
      "type": "number",
      "operators": ["gt", "gte", "lt", "lte", "between"]
    },
    {
      "key": "leaveType",
      "label": "Leave Type",
      "type": "select",
      "operators": ["eq", "neq", "in"],
      "options": ["Annual", "Sick", "Emergency", "Unpaid"]
    },
    {
      "key": "employeeGrade",
      "label": "Employee Grade",
      "type": "select",
      "operators": ["eq", "neq", "in"],
      "options": ["Junior", "Mid", "Senior", "Manager"]
    },
    {
      "key": "customFields.region",
      "label": "Region",
      "type": "text",
      "operators": ["eq", "contains"]
    }
  ]
}
```

### Field Schema Example: Attendance

```json
{
  "module": "attendance",
  "event": "attendance.adjustment.requested",
  "entityType": "AttendanceAdjustment",
  "fields": [
    {
      "key": "durationMinutes",
      "label": "Duration Minutes",
      "type": "number",
      "operators": ["gt", "gte", "lt", "lte", "between"]
    },
    {
      "key": "adjustmentType",
      "label": "Adjustment Type",
      "type": "select",
      "operators": ["eq", "neq", "in"],
      "options": ["Missing Check In", "Missing Check Out", "Overtime", "Remote Work"]
    },
    {
      "key": "impactsPayroll",
      "label": "Impacts Payroll",
      "type": "boolean",
      "operators": ["eq"]
    }
  ]
}
```

---

## 15. Runtime Workflow

### Runtime Flow

```txt
+------------------+       +------------------+
| Admin            |       | Workflow Builder |
+--------+---------+       +---------+--------+
         |                           |
         | Create workflow            |
         |-------------------------->|
         | Select module/event        |
         |-------------------------->|
         | Configure rules/steps      |
         |-------------------------->|
         | Publish workflow           |
         |-------------------------->|
         |                           |
         v                           v

+------------------+       +------------------+
| Requester        |       | Source Module    |
+--------+---------+       +---------+--------+
         |                           |
         | Submit request             |
         |-------------------------->|
         |                           |
         |                           v
         |                 +------------------+
         |                 | Workflow Runtime |
         |                 +---------+--------+
         |                           |
         |                           v
         |                 +------------------+
         |                 | Rule Engine      |
         |                 +---------+--------+
         |                           |
         |                           v
         |                 +------------------+
         |                 | Create Steps     |
         |                 +---------+--------+
         |                           |
         |                           v
         |                 +------------------+
         |                 | Approver Task    |
         |                 +---------+--------+
         |                           |
         |                           v
         |                 +------------------+
         |                 | Outcome Handler  |
         |                 +------------------+
```

### Workflow Creation Flow

```txt
Source Module submits request
        |
        v
Validate source request
        |
        v
Save source request as UNDER_REVIEW
        |
        v
Trigger workflow event
        |
        v
Find published workflow by module + event
        |
        +-----------------------------+
        | Workflow found?             |
        +-------------+---------------+
                      |
          +-----------+-----------+
          |                       |
         No                      Yes
          |                       |
          v                       v
Return error:              Evaluate trigger
No workflow configured     conditions
                                  |
                                  v
                       +---------------------+
                       | Conditions match?   |
                       +----------+----------+
                                  |
                       +----------+----------+
                       |                     |
                      No                    Yes
                       |                     |
                       v                     v
              Skip workflow or       Evaluate approval
              use fallback           rules
                                             |
                                             v
                                  +------------------+
                                  | Rule matched?    |
                                  +--------+---------+
                                           |
                              +------------+------------+
                              |                         |
                             No                        Yes
                              |                         |
                              v                         v
                     Use fallback or            Load step configs
                     return error                       |
                                                        v
                                                Resolve assignees
                                                        |
                                                        v
                                           +------------------------+
                                           | Assignees found?       |
                                           +-----------+------------+
                                                       |
                                          +------------+------------+
                                          |                         |
                                         No                        Yes
                                          |                         |
                                          v                         v
                               Workflow creation failed      Create instance
                                                                    |
                                                                    v
                                                           Create steps
                                                                    |
                                                                    v
                                                           Activate first step
                                                                    |
                                                                    v
                                                           Log audit event
                                                                    |
                                                                    v
                                                           Notify approver
```

### Approval Flow

```txt
Approver opens pending task
        |
        v
View workflow step detail
        |
        v
Choose decision
        |
        +-----------------------------+
        | Approve or Reject?          |
        +-------------+---------------+
                      |
          +-----------+-----------+
          |                       |
       Approve                  Reject
          |                       |
          v                       v
Validate approver          Open reject modal
          |                       |
          v                       v
Mark step approved         Reason provided?
          |                       |
          v              +--------+--------+
Next step exists?         |                 |
          |              No                Yes
 +--------+--------+     |                 |
 |                 |     v                 v
Yes               No  Show error      Mark step rejected
 |                 |                       |
 v                 v                       v
Activate       Mark workflow          Mark remaining
next step      approved               steps skipped
 |                 |                       |
 v                 v                       v
Notify next    Execute approved       Mark workflow
approver       outcome                rejected
                   |                       |
                   v                       v
              Source module          Execute rejected
              finalizes              outcome
              business outcome            |
                                          v
                                   Source module marks
                                   request rejected
```

---

## 16. Example Workflows

### 16.1 Expense Workflow

```txt
Workflow Name: Expense Approval Workflow
Module: Expense
Event: expense.submitted
```

Rules:

| Rule | Condition | Steps |
|---|---|---|
| Small Expense | amount < 2000 | Department Reviewer -> Accounts Officer |
| Medium Expense | amount >= 2000 and amount < 5000 | Department Reviewer -> Requester Manager -> Accounts Officer |
| Large Expense | amount >= 5000 and amount < 10000 | Department Reviewer -> Requester Manager -> Finance Admin -> Accounts Officer |
| High Value Expense | amount >= 10000 | Department Reviewer -> Requester Manager -> Finance Admin -> CFO -> Accounts Officer |

Approved outcome:

```txt
Set Expense status to APPROVED
Create Payment Request
Notify Requester
Notify Accounts Officer
```

Rejected outcome:

```txt
Set Expense status to REJECTED
Require rejection reason
Allow resubmission
Notify requester
```

### 16.2 Leave Workflow

```txt
Workflow Name: Leave Approval Workflow
Module: Leave
Event: leave.requested
```

Rules:

| Rule | Condition | Steps |
|---|---|---|
| Short Leave | leaveDays <= 2 | Requester Manager -> HR Officer |
| Medium Leave | leaveDays > 2 and leaveDays <= 7 | Requester Manager -> Department Head -> HR Officer |
| Long Leave | leaveDays > 7 and leaveDays <= 15 | Requester Manager -> Department Head -> HR Manager -> HR Officer |
| Extended Leave | leaveDays > 15 | Requester Manager -> Department Head -> HR Manager -> Management -> HR Officer |

Approved outcome:

```txt
Set Leave status to APPROVED
Deduct Leave Balance
Create Leave Calendar Entry
Notify Requester
Notify HR
```

Rejected outcome:

```txt
Set Leave status to REJECTED
Require rejection reason
Notify requester
```

### 16.3 Future Attendance Workflow

```txt
Workflow Name: Attendance Adjustment Workflow
Module: Attendance
Event: attendance.adjustment.requested
```

Rules:

| Rule | Condition | Steps |
|---|---|---|
| Basic Correction | impactsPayroll = false | Requester Manager -> HR Officer |
| Payroll Correction | impactsPayroll = true | Requester Manager -> HR Officer -> Payroll Officer |

Approved outcome:

```txt
Set Attendance Adjustment status to APPROVED
Update Attendance Record
Notify Requester
```

Rejected outcome:

```txt
Set Attendance Adjustment status to REJECTED
Require rejection reason
Notify requester
```

---

## 17. Statuses

### Workflow Template Status

```txt
DRAFT
PUBLISHED
INACTIVE
ARCHIVED
```

### Workflow Instance Status

```txt
PENDING
ACTIVE
APPROVED
REJECTED
CANCELLED
FAILED
```

### Workflow Step Status

```txt
WAITING
ACTIVE
APPROVED
REJECTED
SKIPPED
```

### Expense Status

```txt
DRAFT
SUBMITTED
UNDER_REVIEW
REJECTED
APPROVED
PAYMENT_PENDING
PAID
CANCELLED
```

### Leave Status

```txt
DRAFT
REQUESTED
UNDER_REVIEW
REJECTED
APPROVED
CANCELLED
```

### Attendance Adjustment Status

```txt
DRAFT
REQUESTED
UNDER_REVIEW
REJECTED
APPROVED
APPLIED
CANCELLED
```

---

## 18. Application Architecture

```txt
+--------------------------------------------------------------+
|                        Frontend App                           |
+-------------------------------+------------------------------+
                                |
                                v
+--------------------------------------------------------------+
|                         Backend API                           |
+------+----------+----------+----------+----------+-----------+
       |          |          |          |          |
       v          v          v          v          v
+-----------+ +----------+ +---------+ +---------+ +-----------+
| Workflow  | | Workflow | | Expense | | Leave   | | Payment   |
| Builder   | | Runtime  | | Module  | | Module  | | Module    |
+-----+-----+ +----+-----+ +----+----+ +----+----+ +-----+-----+
      |            |            |           |            |
      |            |            v           v            |
      |            |      +----------------------+       |
      |            |      | Internal Event       |       |
      |            |      | Dispatcher           |       |
      |            |      +----------+-----------+       |
      |            |                 |                   |
      |            v                 v                   |
      |      +-------------+  +-------------+             |
      |      | Rule Engine |  | Outcome     |             |
      |      |             |  | Handler     |             |
      |      +------+------+  +------+------+             |
      |             |                |                    |
      v             v                v                    v
+--------------------------------------------------------------+
|                         Database                              |
| users, departments, workflow configs, workflow runtime,        |
| expenses, leaves, payments, audit logs, notifications          |
+--------------------------------------------------------------+
```

Note:

```txt
For this assessment, the Internal Event Dispatcher can be a simple service call.
No Kafka, RabbitMQ, Redis, or external queue is required.
```

---

## 19. Backend Module Structure

```txt
src/
  modules/
    users/
    departments/

    workflow-builder/
      workflow-template.entity.ts
      workflow-event-schema.entity.ts
      workflow-trigger-condition.entity.ts
      workflow-approval-rule.entity.ts
      workflow-approval-step-config.entity.ts
      workflow-outcome-config.entity.ts
      workflow-builder.controller.ts
      workflow-builder.service.ts
      dto/

    workflow-runtime/
      workflow-instance.entity.ts
      workflow-step.entity.ts
      workflow-action.entity.ts
      workflow-runtime.controller.ts
      workflow-runtime.service.ts
      rule-engine.service.ts
      assignee-resolver.service.ts
      outcome-handler.service.ts
      dto/

    expenses/
      expense.controller.ts
      expense.service.ts
      expense.entity.ts
      dto/

    leaves/
      leave.controller.ts
      leave.service.ts
      leave.entity.ts
      dto/

    payments/
      payment-request.entity.ts
      payment.service.ts
      payment.controller.ts

    audit-logs/
      audit-log.entity.ts
      audit-log.service.ts

    notifications/
      notification.entity.ts
      notification.service.ts

    dashboard/
      dashboard.controller.ts
      dashboard.service.ts
```

---

## 20. Data Model Overview

### ASCII ERD

```txt
+-------------------+        +-------------------+
| USER              |        | DEPARTMENT        |
+-------------------+        +-------------------+
| id                |        | id                |
| name              |        | name              |
| role              |        | headUserId        |
| departmentId      |------->|                   |
| managerId         |        +-------------------+
+---------+---------+
          |
          | creates
          v
+-------------------+        +-------------------+
| EXPENSE           |        | LEAVE_REQUEST     |
+-------------------+        +-------------------+
| id                |        | id                |
| requesterId       |        | requesterId       |
| amount            |        | leaveDays         |
| status            |        | status            |
| customFieldsJson  |        | customFieldsJson  |
+---------+---------+        +---------+---------+
          |                            |
          | triggers                   | triggers
          v                            v
+------------------------------------------------+
| WORKFLOW_INSTANCE                              |
+------------------------------------------------+
| id                                             |
| workflowTemplateId                             |
| workflowApprovalRuleId                         |
| moduleName                                     |
| eventName                                      |
| entityType                                     |
| entityId                                       |
| requesterId                                   |
| departmentId                                  |
| status                                         |
| metadataJson                                   |
+----------------------+-------------------------+
                       |
                       | contains
                       v
+------------------------------------------------+
| WORKFLOW_STEP                                  |
+------------------------------------------------+
| id                                             |
| workflowInstanceId                             |
| stepOrder                                      |
| stepName                                       |
| assigneeType                                   |
| assignedUserId                                 |
| assignedRole                                   |
| status                                         |
| comment                                        |
| rejectionReason                                |
+----------------------+-------------------------+
                       |
                       | records
                       v
+------------------------------------------------+
| WORKFLOW_ACTION                                |
+------------------------------------------------+
| id                                             |
| workflowInstanceId                             |
| workflowStepId                                 |
| action                                         |
| actorUserId                                    |
| comment                                        |
| reason                                         |
+------------------------------------------------+


+------------------------------------------------+
| WORKFLOW_TEMPLATE                              |
+------------------------------------------------+
| id                                             |
| name                                           |
| moduleName                                     |
| eventName                                      |
| entityType                                     |
| status                                         |
| priority                                       |
+----------------------+-------------------------+
                       |
       +---------------+----------------+
       |                                |
       v                                v
+-----------------------+      +--------------------------+
| WORKFLOW_APPROVAL_RULE|      | WORKFLOW_OUTCOME_CONFIG  |
+-----------------------+      +--------------------------+
| id                    |      | id                       |
| workflowTemplateId    |      | workflowTemplateId       |
| name                  |      | onApprovedJson           |
| priority              |      | onRejectedJson           |
| conditionJson         |      +--------------------------+
| isFallback            |
+-----------+-----------+
            |
            v
+-------------------------------+
| WORKFLOW_APPROVAL_STEP_CONFIG |
+-------------------------------+
| id                            |
| workflowApprovalRuleId         |
| stepOrder                     |
| stepName                      |
| stepType                      |
| assigneeType                  |
| assigneeRole                  |
| assigneeUserId                |
| assigneeFieldPath             |
+-------------------------------+
```

---

## 21. Main Entities

### 21.1 WorkflowTemplate

```txt
id
name
description
moduleName
eventName
entityType
status
priority
effectiveFrom
effectiveTo
allowResubmission
createdBy
createdAt
updatedAt
```

### 21.2 WorkflowEventSchema

```txt
id
moduleName
eventName
entityType
fieldSchemaJson
outcomeActionsJson
assigneeResolversJson
isActive
createdAt
updatedAt
```

### 21.3 WorkflowTriggerCondition

```txt
id
workflowTemplateId
conditionJson
createdAt
updatedAt
```

### 21.4 WorkflowApprovalRule

```txt
id
workflowTemplateId
name
priority
conditionJson
isFallback
isActive
createdAt
updatedAt
```

### 21.5 WorkflowApprovalStepConfig

```txt
id
workflowApprovalRuleId
stepOrder
stepName
stepType
assigneeType
assigneeRole
assigneeUserId
assigneeFieldPath
isRequired
requiresComment
requiresAttachment
canReject
canReassign
slaHours
escalationAssigneeType
escalationAssigneeRole
escalationAssigneeUserId
createdAt
updatedAt
```

### 21.6 WorkflowOutcomeConfig

```txt
id
workflowTemplateId
onApprovedJson
onRejectedJson
createdAt
updatedAt
```

### 21.7 WorkflowInstance

```txt
id
workflowTemplateId
workflowApprovalRuleId
moduleName
eventName
entityType
entityId
requesterId
departmentId
status
metadataJson
startedAt
completedAt
rejectedAt
createdAt
updatedAt
```

### 21.8 WorkflowStep

```txt
id
workflowInstanceId
stepOrder
stepName
stepType
assignedUserId
assignedRole
assigneeType
status
activatedAt
actedAt
actionByUserId
comment
rejectionReason
createdAt
updatedAt
```

### 21.9 WorkflowAction

```txt
id
workflowInstanceId
workflowStepId
action
actorUserId
comment
reason
metadataJson
createdAt
```

---

## 22. API Requirements

### Workflow Builder APIs

```txt
GET    /workflow-templates
POST   /workflow-templates
GET    /workflow-templates/:id
PATCH  /workflow-templates/:id
POST   /workflow-templates/:id/publish
POST   /workflow-templates/:id/deactivate
POST   /workflow-templates/:id/duplicate
```

### Workflow Event Schema APIs

```txt
GET    /workflow-event-schemas
GET    /workflow-event-schemas?moduleName=expense
GET    /workflow-event-schemas?moduleName=expense&eventName=expense.submitted
```

### Workflow Rule APIs

```txt
POST   /workflow-templates/:id/rules
PATCH  /workflow-rules/:id
DELETE /workflow-rules/:id
```

### Workflow Step Config APIs

```txt
POST   /workflow-rules/:id/steps
PATCH  /workflow-step-configs/:id
DELETE /workflow-step-configs/:id
```

### Workflow Runtime APIs

```txt
POST   /workflow-runtime/trigger
GET    /workflow-instances
GET    /workflow-instances/:id
GET    /workflow-tasks/my-pending
POST   /workflow-steps/:id/approve
POST   /workflow-steps/:id/reject
POST   /workflow-steps/:id/comment
```

### Expense APIs

```txt
POST   /expenses
GET    /expenses
GET    /expenses/:id
PATCH  /expenses/:id
POST   /expenses/:id/submit
POST   /expenses/:id/resubmit
```

### Leave APIs

```txt
POST   /leaves
GET    /leaves
GET    /leaves/:id
PATCH  /leaves/:id
POST   /leaves/:id/submit
POST   /leaves/:id/resubmit
```

### Payment APIs

```txt
GET    /payment-requests
GET    /payment-requests/:id
POST   /payment-requests/:id/mark-paid
```

### Dashboard APIs

```txt
GET    /dashboard/admin
GET    /dashboard/employee
GET    /dashboard/approver
GET    /dashboard/accounts
GET    /dashboard/hr
```

---

## 23. Role-Based Permission Matrix

| Feature | Employee | Reviewer | Manager | HR | Accounts | Finance Admin | Admin |
|---|---:|---:|---:|---:|---:|---:|---:|
| Create expense | Yes | Yes | Yes | No | No | No | Yes |
| Create leave | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Submit own request | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Resubmit rejected own request | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View own request | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View department requests | No | Assigned only | Yes | HR only | Finance only | Finance only | Yes |
| View assigned workflow task | No | Yes | Yes | Yes | Yes | Yes | Yes |
| Approve assigned task | No | Yes | Yes | Yes | Yes | Yes | Yes |
| Reject assigned task | No | Yes | Yes | Yes | Yes | Yes | Yes |
| Add approval comment | No | Yes | Yes | Yes | Yes | Yes | Yes |
| View Workflow Builder | No | No | No | No | No | No | Yes |
| Create workflow | No | No | No | No | No | No | Yes |
| Edit draft workflow | No | No | No | No | No | No | Yes |
| Publish workflow | No | No | No | No | No | No | Yes |
| Deactivate workflow | No | No | No | No | No | No | Yes |
| Duplicate workflow | No | No | No | No | No | No | Yes |
| Manage workflow event schemas | No | No | No | No | No | No | Yes |
| Mark payment paid | No | No | No | No | No | Yes | Yes |
| View audit trail | Own/Assigned | Assigned | Department | HR | Finance | Finance | Yes |
| View dashboards | Own | Approver | Manager | HR | Accounts | Finance | Admin |

---

## 24. Builder Validation Rules

### Basic Validation

```txt
Workflow name is required
Module is required
Event is required
At least one approval rule is required
Each approval rule must have at least one approval step
Each step must have a step name
Each step must have an assignee type
If assignee type is ROLE, role is required
If assignee type is USER, user is required
If assignee type is CUSTOM_FIELD_USER, field path is required
There must be only one fallback rule
Outcome config is required
```

### Rule Validation

```txt
Rule priority must be unique
Rule condition cannot be empty unless fallback rule
Rule condition fields must exist in event field schema
Operator must be valid for selected field type
Value must match field type
Rules should not overlap, optional warning only
```

### Step Validation

```txt
Step order must be unique inside a rule
Required steps cannot be skipped
SLA must be greater than 0 if provided
Reject reason is required during rejection if canReject is true
```

---

## 25. Runtime Validation Rules

### Trigger Validation

```txt
Module name is required
Event name is required
Entity type is required
Entity ID is required
Requester ID is required
Metadata must contain fields required by selected workflow rules
```

### Approval Validation

```txt
Only assigned approver can approve active step
Only assigned approver can reject active step
Only active step can be approved/rejected
Rejected step must include rejection reason
Workflow cannot be approved if any required step is pending
Workflow cannot be changed after approved/rejected unless resubmitted
```

---

## 26. Dashboard Requirements

### Admin Dashboard

```txt
Total workflows
Published workflows
Draft workflows
Inactive workflows
Recent workflow changes
Failed workflow triggers
```

### Employee Dashboard

```txt
My submitted expenses
My leave requests
Rejected requests
Pending requests
Approved requests
Paid expenses
```

### Approver Dashboard

```txt
My pending approval tasks
Approved by me
Rejected by me
Average approval time
Overdue approval tasks
```

### Accounts Dashboard

```txt
Expenses waiting for accounts review
Payment requests pending
Paid amount this month
Rejected expenses by accounts
```

### HR Dashboard

```txt
Leave requests waiting for HR
Approved leave requests
Rejected leave requests
Attendance adjustment requests
```

---

## 27. Minimum Screens

### Workflow Screens

```txt
Workflow List Page
Workflow Builder Page
Workflow Rule Builder Modal
Approval Step Builder Modal
Workflow Preview Page
Workflow Instance Detail Page
My Pending Approvals Page
```

### Expense Screens

```txt
Expense List Page
Create Expense Page
Expense Detail Page
Submit/Resubmit Expense Action
```

### Leave Screens

```txt
Leave List Page
Create Leave Request Page
Leave Detail Page
Submit/Resubmit Leave Action
```

### Payment Screens

```txt
Payment Request List Page
Payment Request Detail Page
Mark Payment as Paid Action
```

### Dashboard Screens

```txt
Admin Dashboard
Employee Dashboard
Approver Dashboard
Accounts Dashboard
HR Dashboard
```

---

## 28. Seed Data

### Users

| Name | Role | Department |
|---|---|---|
| Sarah Employee | Employee | Sales |
| John Reviewer | Department Reviewer | Sales |
| Maria Manager | Manager | Sales |
| Abdul Accounts | Accounts Officer | Accounts |
| Fatima Finance Admin | Finance Admin | Finance |
| Rahim HR Officer | HR Officer | HR |
| Nusrat HR Manager | HR Manager | HR |
| Farhan CFO | CFO | Finance |
| Rafi Payroll Officer | Payroll Officer | Payroll |

### Workflow Event Schemas

| Module | Event |
|---|---|
| Expense | expense.submitted |
| Leave | leave.requested |
| Attendance | attendance.adjustment.requested |

### Workflow Templates

| Name | Module | Event | Status |
|---|---|---|---|
| Expense Approval Workflow | Expense | expense.submitted | Published |
| Leave Approval Workflow | Leave | leave.requested | Published |
| Attendance Adjustment Workflow | Attendance | attendance.adjustment.requested | Draft |

### Expense Requests

| Title | Amount | Status |
|---|---:|---|
| Client Lunch | 850 | Draft |
| Travel to Client Office | 4,500 | Under Review |
| Laptop Repair | 7,500 | Under Review |
| Marketing Event Cost | 35,000 | Approved |
| Fuel Reimbursement | 2,200 | Rejected |
| Vendor Advance | 18,000 | Payment Pending |
| Hotel Stay | 22,000 | Paid |

### Leave Requests

| Leave Type | Days | Status |
|---|---:|---|
| Annual Leave | 2 | Draft |
| Sick Leave | 3 | Under Review |
| Annual Leave | 10 | Under Review |
| Emergency Leave | 1 | Approved |
| Unpaid Leave | 20 | Rejected |

---

## 29. Acceptance Criteria

### Workflow Builder

```txt
Given an admin opens Workflow Builder
When they select Expense module
Then the event dropdown should show Expense events
```

```txt
Given an admin selects expense.submitted
When the event is selected
Then condition fields like amount, category, department, and custom fields should be available
```

```txt
Given an admin creates a rule for amount > 5000
When they add approval steps
Then the workflow should save those steps under that rule
```

```txt
Given an admin publishes the workflow
When an expense is submitted
Then the workflow runtime should use the published configuration
```

### Runtime

```txt
Given a submitted expense amount is 7000
When expense.submitted is triggered
Then the system should match the rule amount >= 5000 and amount < 10000
And create the configured approval steps
```

```txt
Given a submitted leave request has leaveDays = 10
When leave.requested is triggered
Then the system should match the long leave rule
And create the configured leave approval steps
```

```txt
Given an attendance adjustment impacts payroll
When attendance.adjustment.requested is triggered
Then the system should support creating a workflow from the configured attendance rule
```

### Approval

```txt
Given a workflow step is active
When the assigned approver approves it
Then the system should mark the step as approved
And activate the next step
```

```txt
Given the final workflow step is approved
When no next step exists
Then the workflow should be marked as approved
And the approved outcome should be executed
```

### Rejection

```txt
Given a workflow step is active
When the assigned approver rejects it without reason
Then the system should show a validation error
```

```txt
Given a workflow step is active
When the assigned approver rejects it with a reason
Then the system should mark the workflow as rejected
And mark remaining steps as skipped
And execute the rejected outcome
```

### Audit

```txt
Given any workflow action happens
When the action is completed
Then the system should create an audit log with actor, action, old status, new status, comment, and timestamp
```

---

## 30. Recommended Assessment Scope

### Must Build

```txt
1. Mock users and role switcher
2. Workflow Builder
   - workflow list
   - create workflow
   - select module/event
   - condition builder
   - approval rules
   - approval steps
   - outcome config
   - publish workflow
3. Expense Module
   - create expense
   - submit expense
   - trigger workflow
   - show status and workflow history
4. Leave Module
   - create leave
   - submit leave
   - trigger workflow
   - show status and workflow history
5. Workflow Runtime
   - trigger workflow
   - evaluate rules
   - create steps dynamically
   - approve/reject
   - audit history
6. Payment Module
   - create payment request after expense approval
   - mark payment as paid
7. Dashboard
   - pending approvals
   - request summary
   - workflow status
```

### Nice to Have

```txt
Workflow duplicate
Workflow deactivate
Custom field condition support
Rule overlap warning
SLA field
Escalation field
Preview before publish
In-app notifications
```

### Skip

```txt
Full authentication
Drag-and-drop BPMN designer
Parallel approvals
Real email/SMS notification
Kafka/RabbitMQ
Complex scripting
Multi-tenancy
Full accounting ledger
```

---

## 31. Suggested Demo Script

```txt
1. Switch user to Admin.
2. Open Workflow Builder.
3. Create Expense Approval Workflow.
4. Select module: Expense.
5. Select event: expense.submitted.
6. Add approval rules based on amount.
7. Add approval steps for each rule.
8. Publish workflow.
9. Switch to Employee.
10. Create expense amount 7000.
11. Submit expense.
12. Show workflow created dynamically with 4 steps.
13. Switch to assigned approvers one by one.
14. Approve each step.
15. Show expense approved and payment request created.
16. Mark payment as paid.
17. Show audit trail.
18. Repeat with Leave request.
19. Show same workflow runtime works with leave.requested.
20. Show Attendance event schema exists to prove future extensibility.
```

---

## 32. Final Product Summary

This project implements a configurable ERP Workflow Builder and Runtime module.

Admin users can create workflows by selecting:

```txt
Source module
Module event
Trigger conditions
Approval rules
Approval steps
Reviewer assignment method
Approved outcome
Rejected outcome
```

Business modules such as Expense and Leave trigger workflows through events like:

```txt
expense.submitted
leave.requested
```

The workflow engine evaluates configured conditions and dynamically creates approval tasks.

Approved expense workflows generate payment requests. Approved leave workflows finalize leave approval. The architecture supports future modules such as Attendance, Purchase, Payroll, Procurement, and Invoice Approval without hardcoded approval chains.
