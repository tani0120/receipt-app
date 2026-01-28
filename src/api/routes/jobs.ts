import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { jobRepository } from '../../repositories/jobRepository'

import { JobSchema } from '../../types/zod_schema'

const app = new Hono()

const route = app
    // GET / - List All Jobs
    .get('/', async (c) => {
        try {
            const jobs = await jobRepository.getAllJobs()
            return c.json(jobs)
        } catch (e: any) {
            console.error(e)
            return c.json({ error: 'Failed to fetch jobs' }, 500)
        }
    })
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
        zValidator('json', JobSchema.partial()), // Use Sacred Schema
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
