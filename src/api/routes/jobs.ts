import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { jobRepository } from '../../repositories/jobRepository'

const app = new Hono()

const route = app
    // GET /:id - Fetch Job
    .get('/:id', async (c) => {
        const id = c.req.param('id')
        try {
            const job = await jobRepository.getJob(id)
            if (!job) {
                return c.json({ error: 'Job not found' }, 404)
            }
            return c.json(job)
        } catch (e: any) {
            console.error(e)
            // Debug Mode: Return detailed error
            return c.json({
                error: 'Internal Server Error',
                message: e.message,
                stack: e.stack,
                details: JSON.stringify(e)
            }, 500)
        }
    })

    // PATCH /:id - Save Job (Partial Update)
    .patch(
        '/:id',
        zValidator('json', z.object({}).passthrough()), // Allow any schema for now (Loose typing for Legacy Job)
        async (c) => {
            const id = c.req.param('id')
            const data = c.req.valid('json')
            try {
                await jobRepository.saveJob(id, data as any)
                return c.json({ success: true, id })
            } catch (e) {
                console.error(e)
                return c.json({ error: 'Failed to save job' }, 500)
            }
        }
    )

export default route
