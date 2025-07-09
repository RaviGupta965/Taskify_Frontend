# Logic Document

## 📌 Smart Assign - Implementation (In My Own Words)

The **Smart Assign** feature automates the process of assigning tasks to project members based on certain internal logic handled by the backend. Instead of manually selecting a user, I just provide the task's title, description, status, priority, and project ID. The frontend sends this data to the backend API `/api/smart/`.

The backend then analyzes the project members and decides the most suitable person to assign the task to. The decision-making could be based on factors like:
- Least number of tasks currently assigned
- Role or expertise of the user (if extended)
- Even distribution of work

Once assigned, the task is stored, and the frontend refetches the updated task list to show the new task with its assigned user.

This reduces manual input, avoids overloading team members, and improves productivity and fairness in task delegation.

---

## ⚠️ Conflict Handling – Explanation with Examples

We handle **update conflicts** using **Optimistic Concurrency Control** by storing a `version` number for each task.

### 🔧 How It Works:
- Every task has a `version` field.
- When the frontend sends an update (edit, drag-drop, etc.), it includes the current `version` it knows.
- The backend only applies the update **if the version matches** the current version in the database.
- After a successful update, the backend **increments the version**.

### ✅ Example:

1. User A sees Task 101 with version `3`.
2. User B also sees Task 101 with version `3`.

Now:
- User A changes the status from `Todo` to `In Progress` → sends version `3`.
- Backend updates task, sets version to `4`.

Then:
- User B tries to change priority → sends version `3`.
- Backend rejects it because current version is `4`, meaning someone else has already updated it.

### 🔄 Result:
This ensures **data consistency** and avoids **accidental overwrites**. We refetch tasks after every action to ensure the UI reflects the most recent data.

---
