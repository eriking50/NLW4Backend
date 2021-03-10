import { Request, Response } from "express";
import { getCustomRepository, Not, IsNull } from "typeorm";
import { SurveyUsersRepository } from "../repositories/SurveysUsersRepository";


class NpsController {
    async execute (request: Request, response: Response) {
        const { survey_id } = request.params

        const surveysUsersRepository = getCustomRepository(SurveyUsersRepository)
        const surveyUsers = await surveysUsersRepository.find({
            survey_id,
            value: Not(IsNull())
        })

        const detractors = surveyUsers.filter(survey => survey.value >=0 && survey.value <= 6).length
        
        const promoters = surveyUsers.filter(survey => survey.value >= 9).length
    
        const passives = surveyUsers.filter(survey => survey.value > 6 && survey.value  < 9 ).length

        const totalAnsers = surveyUsers.length

        const calculate = Number((((promoters - detractors) / totalAnsers ) * 100).toFixed(2))

        return response.json({
            detractors,
            promoters,
            passives,
            totalAnsers,
            nps: calculate
        })
    }
}

export { NpsController }